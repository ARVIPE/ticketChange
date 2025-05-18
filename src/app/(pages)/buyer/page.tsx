"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Navbar from "../../components/navbar/navbar";

interface Evento {
  id: number;
  name: string;
  date: string;
  place: string;
  price: number;
}

export default function CompradorPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventos = async () => {
      const { data, error } = await supabase.from("events").select("*");
      if (error) console.error("Error cargando eventos:", error);
      else setEventos(data as Evento[]);
    };

    fetchEventos();
  }, []);

  const comprarEntrada = async (evento: Evento) => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMensaje("Debes iniciar sesión para comprar.");
      return;
    }

    const { data: insertData, error } = await supabase.from("sales").insert([
      {
        user_email: user.email,
        events_name: evento.name,
        price: evento.price,
      },
    ]);

    console.log("Insert response:", insertData, error);

    if (error) {
      console.error("Error al registrar la venta:", error);
      setMensaje("Hubo un error al procesar tu compra.");
    } else {
      setMensaje(`Compra realizada: ${evento.name}`);
    }

    setTimeout(() => setMensaje(null), 3000);
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Eventos Disponibles
        </h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventos.map((evento) => (
            <div
              key={evento.id}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold mb-2">{evento.name}</h2>
              <p className="text-gray-600 mb-1">📅 {evento.date}</p>
              <p className="text-gray-600 mb-2">📍 {evento.place}</p>
              <p className="text-green-600 font-bold mb-4">
                💶 {evento.price} €
              </p>
              <button
                onClick={() => comprarEntrada(evento)}
                className="bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition"
              >
                Comprar entrada
              </button>
            </div>
          ))}
        </div>

        {mensaje && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-xl shadow-md mt-4">
            {mensaje}
          </div>
        )}
      </div>
    </>
  );
}
