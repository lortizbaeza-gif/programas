namespace Cine.Models;

public class Pelicula
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Sinopsis { get; set; } = string.Empty;
    public string Director { get; set; } = string.Empty;
    public string Genero { get; set; } = string.Empty;
    public string? PosterUrl { get; set; }
    public int Duracion { get; set; } = 120; // en minutos
    public string Clasificacion { get; set; } = "B"; // AA, A, B, B15, C, D
    public bool Activa { get; set; } = true;

    public ICollection<Horario> Horarios { get; set; } = new List<Horario>();
    public ICollection<PeliculaSala> PeliculasSalas { get; set; } = new List<PeliculaSala>();
}
