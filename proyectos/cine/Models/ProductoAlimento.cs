namespace Cine.Models;

using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

public class ProductoAlimento
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Categoria { get; set; } = "Combo";
    public string Descripcion { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    // La imagen es opcional: puede subirse como archivo, indicarse por URL o usar el placeholder.
    [ValidateNever]
    public string ImagenUrl { get; set; } = string.Empty;
    public int Existencia { get; set; }
    public int StockMinimo { get; set; } = 5;
    public int? ProveedorId { get; set; }
    public int CantidadBebidas { get; set; }
    public string TamanoPalomitas { get; set; } = "No aplica";
    public string TamanoNachos { get; set; } = "No aplica";
    public bool PermiteExtraQueso { get; set; }
}
