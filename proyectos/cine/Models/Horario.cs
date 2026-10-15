namespace Cine.Models;

public class Horario
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public TimeSpan Hora { get; set; }
    public string FormatoFuncion { get; set; } = "2D";
    public int PeliculaId { get; set; }
    public Pelicula? Pelicula { get; set; }
    public int SalaId { get; set; }
    public Sala? Sala { get; set; }
}
