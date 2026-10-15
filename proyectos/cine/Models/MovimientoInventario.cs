namespace Cine.Models;
public class MovimientoInventario
{
    public int Id { get; set; }
    public int ProductoId { get; set; }
    public string Tipo { get; set; } = "Entrada";
    public int Cantidad { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.Now;
}
