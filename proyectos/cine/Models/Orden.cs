namespace Cine.Models;

public class Orden
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; } = DateTime.Now;
    public decimal Total { get; set; }
    public string MetodoPago { get; set; } = "Tarjeta";
    public decimal Descuento { get; set; }
    public string CodigoBeneficio { get; set; } = string.Empty;
    public int? MiembroClubId { get; set; }
    public string Estado { get; set; } = "Pagada";

    public ICollection<DetalleOrden> Detalles { get; set; } = new List<DetalleOrden>();
}
