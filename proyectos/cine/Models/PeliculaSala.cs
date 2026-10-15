namespace Cine.Models;

public class PeliculaSala
{
    public int Id { get; set; }
    public int PeliculaId { get; set; }
    public Pelicula? Pelicula { get; set; }
    public int SalaId { get; set; }
    public Sala? Sala { get; set; }
}
