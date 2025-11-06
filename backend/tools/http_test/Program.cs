using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;

var baseUrl = "http://localhost:5180";
using var handler = new HttpClientHandler { CookieContainer = new CookieContainer() };
using var client = new HttpClient(handler) { BaseAddress = new Uri(baseUrl) };

var loginPayload = new { EmailInstitucional = "admin@unmsm.edu.pe", Contrasena = "123456" };
Console.WriteLine("Enviando login...");
var loginResp = await client.PostAsJsonAsync("/api/Usuarios/login", loginPayload);
Console.WriteLine($"Login status: {loginResp.StatusCode}");
var loginText = await loginResp.Content.ReadAsStringAsync();
Console.WriteLine(loginText);

if (!loginResp.IsSuccessStatusCode) return 1;

var reservaPayload = new { LibroID = 1241 };
Console.WriteLine("Creando reserva...");
var reservaResp = await client.PostAsJsonAsync("/api/Reservas", reservaPayload);
Console.WriteLine($"Reserva status: {reservaResp.StatusCode}");
var reservaText = await reservaResp.Content.ReadAsStringAsync();
Console.WriteLine(reservaText);

return 0;