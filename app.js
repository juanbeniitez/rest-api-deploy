const express = require("express");
const crypto = require("node:crypto");

const cors = require("cors");

const movies = require("../movies.json");
const { validateMovie, validatePartialMovie } = require("../schemas/movies");

//REST ES UNA ARQUITECTURA DE SOFTWARE 2000 - Roy Fielding
// Escabilidad
// Simplicidad
// Portabilidad
// Fiabilidad
// Fácil de modificar
// Visibilidad

// Resources: Recurso puede ser cualquier cosa [entidad o colecciones de entidades] -> se deben identificar con una url
// Verbos HTTP: Definir las operaciones que se pueden hacer con los recursos CRUD [create, read, update y delete]
// Representaciones: JSON, XML, HTML, etc.. El cliente debería poder elegir la representación del recurso
// Stateless: El servidor no debe guardar información para poder responder a las peticiones, el cliente debe enviar
// los datos necesarios en la request para poder responder a la información
// Interfaz consistente entre cliente y servidor
// Separación de conceptos: Permie que cliente y servidor evolucionen  de forma separada

// Idempotencia: Propiedad de realizar una acción determinada varias veces
//y aun así conseguir siempre el mismo resultado

//metodos normales: GET/HEAD/POST
// metodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight
// OPTIONS

const app = express();
app.disable("x-powered-by");

app.use(cors({
    origin: (origin, callback) => {

        const ACCPTED_ORIGINS = [
            "http://localhost:8080",
            "http://localhost:5000",
            "https://movies.com",
        ]

        if(ACCPTED_ORIGINS.includes(origin)){
            return callback(null, true)
        }

        if(!origin){
            return callback(null, true)
        }

        return callback(new Error('Nor allowed by CORS'))
    }
}));

const PORT = process.env.PORT ?? 5000;



app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "hola mundo" });
});

// Todos los recurso se identifican con /movies
app.get("/movies", (req, res) => {
  const { genre } = req.query;

  if (genre) {
    const filterdMovies = movies.filter((movie) =>
      movie.genre.some(
        (g) => g.toLocaleLowerCase() === genre.toLocaleLowerCase()
      )
    );
    return res.json(filterdMovies);
  }

  res.json(movies);
});

app.get("/movies/:id", (req, res) => {
  const { id } = req.params;
  const movie = movies.find((movie) => movie.id === id);
  if (movie) return res.json(movie);

  res.status(404).json({ message: "Movie not found" });
});

app.post("/movies", (req, res) => {
  const result = validateMovie(req.body);

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const newMovie = {
    id: crypto.randomUUID,
    ...result.data,
  };

  movies.push(newMovie);

  res.status(201).json(newMovie); // actualizar la caché del cliente
});

app.patch("/movies/:id", (req, res) => {
  const { id } = req.params;
  const result = validatePartialMovie(req.body);

  if (!result.success) {
    return res.status(400).json({ message: "The movie was not found." });
  }

  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "The movie was not found." });
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  };

  movies[movieIndex] = updateMovie;

  return res.json(updateMovie);
});

app.delete("/movies/:id", (req, res) => {
  const { id } = req.params;

  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "The movie was not found." });
  }

  movies.splice(movieIndex, 1);

  return res.json({ message: "Movie deleted" });
});

app.listen(PORT, () => {
  console.log("Server listen in http://localhost:5000");
});
