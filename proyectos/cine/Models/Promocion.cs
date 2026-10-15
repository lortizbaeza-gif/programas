namespace Cine.Models;
public class Promocion
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public decimal DescuentoPorcentaje { get; set; }
    public DateTime Inicio { get; set; } = DateTime.Today;
    public DateTime Fin { get; set; } = DateTime.Today.AddMonths(1);
    public bool Activa { get; set; } = true;
}
