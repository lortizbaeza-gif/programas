namespace Cine.Models;
public class UsuarioSistema
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string Rol { get; set; } = "Cajero";
    public bool Activo { get; set; } = true;
    public bool DobleFactor { get; set; }
    public DateTime Creado { get; set; } = DateTime.Now;
}
