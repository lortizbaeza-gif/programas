namespace Cine.Models;

public class FuncionPeliculaInput
{
    public int SalaId { get; set; }
    public bool Disponible { get; set; }
    public DateTime Fecha { get; set; } = DateTime.Today.AddDays(1);
    public TimeSpan Hora { get; set; } = new(18, 0, 0);
    public string Formato { get; set; } = "2D";
}
