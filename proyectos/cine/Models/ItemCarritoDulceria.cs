using System.Text.Json.Serialization;

namespace Cine.Models;

public class ItemCarritoDulceria
{
    public int ProductoId { get; set; }
    public string Tamano { get; set; } = "Mediano";
    public string Sabor { get; set; } = "Original";
    public string Bebida1 { get; set; } = string.Empty;
    public string Bebida2 { get; set; } = string.Empty;
    public List<string> Bebidas { get; set; } = new();
    public string TamanoNachos { get; set; } = string.Empty;
    public bool ExtraQueso { get; set; }
    public bool AgregarSalsa { get; set; }
    public bool AgregarHielo { get; set; }

    [JsonIgnore]
    public ProductoAlimento? Producto { get; set; }

    public string DescripcionPersonalizacion()
    {
        var opciones = new List<string>();
        if (!string.IsNullOrWhiteSpace(Tamano)) opciones.Add(Tamano);
        if (!string.IsNullOrWhiteSpace(Sabor) && Sabor != "Original") opciones.Add(Sabor);
        var bebidasElegidas = Bebidas.Count > 0
            ? Bebidas
            : new[] { Bebida1, Bebida2 }.Where(b => !string.IsNullOrWhiteSpace(b)).ToList();
        for (var i = 0; i < bebidasElegidas.Count; i++)
            opciones.Add($"bebida {i + 1}: {bebidasElegidas[i]}");
        if (!string.IsNullOrWhiteSpace(TamanoNachos))
            opciones.Add($"nachos {TamanoNachos.ToLowerInvariant()}");
        if (ExtraQueso) opciones.Add("con extra queso");
        if (AgregarSalsa) opciones.Add("con salsa");
        if (AgregarHielo) opciones.Add("con hielo");
        return string.Join(", ", opciones);
    }
}
