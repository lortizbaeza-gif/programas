namespace Cine.Models;
public class TicketSoporte
{
    public int Id { get; set; }
    public string Cliente { get; set; } = string.Empty;
    public string Tipo { get; set; } = "Queja";
    public string Descripcion { get; set; } = string.Empty;
    public string Estado { get; set; } = "Abierto";
    public DateTime Fecha { get; set; } = DateTime.Now;
    public string Resolucion { get; set; } = string.Empty;
}
