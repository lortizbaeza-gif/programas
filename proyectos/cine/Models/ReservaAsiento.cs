namespace Cine.Models;
public class ReservaAsiento
{
    public int Id { get; set; }
    public int HorarioId { get; set; }
    public int AsientoId { get; set; }
    public int OrdenId { get; set; }
    public DateTime Fecha { get; set; } = DateTime.Now;
}
