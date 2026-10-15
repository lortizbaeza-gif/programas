namespace Cine.Models;
public class Activo
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Categoria { get; set; } = "Equipo";
    public string Ubicacion { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public string Estado { get; set; } = "Operativo";
}
