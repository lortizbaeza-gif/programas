namespace Cine.Models;
public class TurnoCaja
{
    public int Id { get; set; }
    public string Cajero { get; set; } = string.Empty;
    public DateTime Apertura { get; set; } = DateTime.Now;
    public DateTime? Cierre { get; set; }
    public decimal FondoInicial { get; set; }
    public decimal EfectivoFinal { get; set; }
    public string Estado { get; set; } = "Abierto";
    public string Observaciones { get; set; } = string.Empty;
}
