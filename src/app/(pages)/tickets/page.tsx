'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/navbar/navbar';

interface Ticket {
  id: number;
  events_name: number;
  selling_date: string;
  price: number;
}

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTickets() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sales')
        .select('id, events_name, selling_date, price')
        .eq('user_email', user.email);

      if (error) console.error('Error fetching tickets:', error);
      setTickets(data || []);
      setLoading(false);
    }

    fetchTickets();
  }, []);

  return <>
  <Navbar/>
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">🎟 My Tickets</h1>

      {loading ? (
        <p className="text-xl">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p className="text-xl text-gray-600">No tickets found.</p>
      ) : (
        <div className="max-w-lg w-full bg-white p-6 rounded-lg shadow-lg">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="border-b py-3">
              <h2 className="text-xl font-semibold">{ticket.events_name}</h2>
              <p className="text-gray-600">📅 {ticket.selling_date}</p>
              <p className="text-gray-600">🎭 Price: {ticket.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  </>
}
