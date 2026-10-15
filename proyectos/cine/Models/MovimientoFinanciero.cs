namespace Cine.Models;
public class MovimientoFinanciero
{
    public int Id { get; set; }
    public string Tipo { get; set; } = "Egreso";
    public string Concepto { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public string Categoria { get; set; } = "Operación";
    public DateTime Fecha { get; set; } = DateTime.Today;
    public string Estado { get; set; } = "Registrado";
}
