'use client';

import Shell from '@/components/Shell';
import { api, getToken } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, ExternalLink, AlertTriangle } from 'lucide-react';

type Centre = {
  _id: string;
  name: string;
  address: string;
  city: string;
  pincode: string;
  acceptedMaterials: string[];
  phone: string;
  source: string;
};

type CentreSearch = {
  location: { pincode: string; city: string; state: string; country: string };
  centres: Centre[];
};

export default function Centres() {
  const [pincode, setPincode] = useState('');
  const [location, setLocation] = useState<CentreSearch['location'] | null>(null);
  const [items, setItems] = useState<Centre[]>([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLocation(null);
    setItems([]);
    setSearched(false);
    if (!/^\d{6}$/.test(pincode)) {
      setError('Enter a valid six-digit Indian PIN code.');
      return;
    }

    setBusy(true);
    try {
      const result = await api<CentreSearch>(
        `/recycling-centres?pincode=${encodeURIComponent(pincode)}`,
      );
      setLocation(result.location);
      setItems(result.centres);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not look up this PIN code.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);

  return (
    <Shell>
      <p className="eyebrow">Local sorting starts here</p>
      <h1 className="mt-2 text-3xl font-black">Collection centres</h1>
      <p className="mt-2 max-w-2xl leading-6 muted">
        Enter your six-digit Indian PIN code to find its location and search for
        recycling centres nearby. Only real centre records are shown.
      </p>
      <form onSubmit={search} className="panel mt-6 flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-leaf" size={18} />
          <input
            className="field pl-10"
            value={pincode}
            onChange={event => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter six-digit PIN code"
            aria-label="Six-digit Indian PIN code"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            required
          />
        </div>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Searching…' : 'Search centres'}
        </button>
      </form>
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      {location && (
        <section className="panel mt-5 p-5" aria-live="polite">
          <h2 className="font-extrabold">PIN code {location.pincode}</h2>
          <p className="mt-2 text-sm muted">
            <b>City:</b> {location.city} · <b>State:</b> {location.state} ·{' '}
            <b>Country:</b> {location.country}
          </p>
        </section>
      )}
      {searched && items.length === 0 && (
        <div className="panel mt-5 p-8 text-center">
          <MapPin className="mx-auto text-leaf" size={28} />
          <h2 className="mt-3 font-bold">No verified centre records found</h2>
          <p className="mt-2 text-sm muted">
            There are no real recycling-centre listings for this location yet.
            We do not display sample or unverified centre details.
          </p>
        </div>
      )}
      {items.length > 0 && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {items.map(centre => (
            <article key={centre._id} className="panel p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-mint p-3 text-leaf">
                  <MapPin size={21} />
                </span>
                <div className="flex-1">
                  <h2 className="font-extrabold">{centre.name}</h2>
                  <p className="mt-1 text-sm muted">{centre.city} · {centre.pincode}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6">{centre.address}</p>
              <p className="mt-3 text-sm">
                <b>Accepted materials:</b> {centre.acceptedMaterials?.join(', ') || 'Not listed'}
              </p>
              <p className="mt-2 text-sm"><b>Contact:</b> {centre.phone || 'Not available'}</p>
              <p className="mt-3 flex gap-2 text-xs leading-5 muted">
                <AlertTriangle size={15} className="shrink-0" />{centre.source}
              </p>
              <a
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-leaf"
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${centre.name} ${centre.address} ${centre.city}`)}`}
              >
                Search map <ExternalLink size={15} />
              </a>
            </article>
          ))}
        </div>
      )}
    </Shell>
  );
}