'use client';

import Shell from '@/components/Shell';
import { api, getToken } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Recycle,
  ScanSearch,
  Video,
  VideoOff,
} from 'lucide-react';

type Analysis = {
  _id: string;
  itemCategory: string;
  plasticType: string;
  confidence: number;
  observations: string[];
  recyclability: string;
  preparationSteps: string[];
  recommendedAction: string;
  impact: string;
  safetyWarning: string;
  aiModel: string;
  mode: string;
};

export default function Analyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Analysis | null>(null);
  const [showDisposalGuidance, setShowDisposalGuidance] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    };
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }

  async function startCamera() {
    setError('');
    setResult(null);
    setFile(null);
    setShowDisposalGuidance(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported in this browser.');
      return;
    }

    setCameraStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (!mountedRef.current) return;
      setCameraActive(true);
    } catch (e) {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (mountedRef.current) {
        setError(
          e instanceof Error
            ? `Could not start the camera: ${e.message}`
            : 'Could not start the camera. Check camera permissions and try again.',
        );
      }
    } finally {
      if (mountedRef.current) setCameraStarting(false);
    }
  }

  function capturePlastic() {
    setError('');
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError('The camera is not ready yet. Please wait and try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setError('Could not capture an image from the camera.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) {
        setError('Could not capture an image from the camera.');
        return;
      }
      if (blob.size > 5 * 1024 * 1024) {
        setError('Captured image is larger than 5 MB. Please try again.');
        return;
      }

      setFile(new File([blob], 'plastic-scan.jpg', { type: 'image/jpeg' }));
      setError('');
      setResult(null);
      setShowDisposalGuidance(false);
      stopCamera();
    }, 'image/jpeg', 0.9);
  }

  async function analyze() {
    if (!file) return;
    setBusy(true);
    setError('');
    setResult(null);
    setShowDisposalGuidance(false);
    try {
      const form = new FormData();
      form.append('image', file);
      const data = await api<{ analysis: Analysis }>('/analyze', {
        method: 'POST',
        body: form,
      });
      setResult(data.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <p className="eyebrow">Vision-powered guidance</p>
      <h1 className="mt-2 text-3xl font-black">AI waste analyzer</h1>
      <p className="mt-2 max-w-2xl leading-6 muted">
        Scan one plastic item with your camera. The configured Ollama vision model
        assesses visible clues; a photo cannot reliably prove the exact resin or
        local recyclability.
      </p>

      <div className="mt-7 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <section className="panel p-6">
          <h2 className="font-extrabold">Camera scan</h2>
          <p className="mt-1 text-sm muted">Position one item clearly in view.</p>

          <div className="mt-5 flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-2xl bg-cream p-4 text-center">
            {preview && (
              <img
                src={preview}
                alt="Captured image of plastic item"
                className="max-h-80 max-w-full rounded-xl object-contain"
              />
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="Live camera preview"
              className={`max-h-80 w-full rounded-xl object-contain ${cameraActive && !preview ? '' : 'hidden'}`}
            />
            {!preview && !cameraActive && (
              <>
                <span className="rounded-2xl bg-mint p-4 text-leaf">
                  <Video size={27} />
                </span>
                <b className="mt-4">Camera preview will appear here</b>
                <span className="mt-2 text-sm muted">
                  Camera permission may be required.
                </span>
              </>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {!cameraActive ? (
              <button
                disabled={cameraStarting || busy}
                onClick={startCamera}
                className="btn btn-primary w-full disabled:opacity-50"
              >
                {cameraStarting ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <Video size={18} />
                )}
                {cameraStarting ? 'Starting camera…' : 'Start Camera'}
              </button>
            ) : (
              <>
                <button
                  disabled={busy}
                  onClick={capturePlastic}
                  className="btn btn-primary w-full disabled:opacity-50"
                >
                  <ScanSearch size={18} />
                  Capture Plastic
                </button>
                <button onClick={stopCamera} className="btn btn-quiet w-full">
                  <VideoOff size={18} />
                  Stop Camera
                </button>
              </>
            )}
          </div>

          {file && (
            <button
              disabled={busy}
              onClick={analyze}
              className="btn btn-primary mt-3 w-full disabled:opacity-50"
            >
              {busy ? (
                <LoaderCircle className="animate-spin" size={18} />
              ) : (
                <ScanSearch size={18} />
              )}
              {busy ? 'Analyzing scan…' : 'Analyze Scan'}
            </button>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <p className="mt-3 text-xs leading-5 muted">
            Live AI only. If Ollama or its model is unavailable, you will see an
            error instead of a made-up result.
          </p>
        </section>

        <section className="panel min-h-80 p-6">
          <h2 className="font-extrabold">Analysis results</h2>
          {busy ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <LoaderCircle className="animate-spin text-leaf" size={34} />
              <p className="mt-4 font-bold">Reviewing visible details…</p>
              <p className="mt-2 text-sm muted">
                Local model inference may take a minute.
              </p>
            </div>
          ) : !result ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <span className="rounded-2xl bg-mint p-4 text-leaf">
                <Recycle size={29} />
              </span>
              <p className="mt-4 font-bold">Your guidance will appear here</p>
              <p className="mt-2 max-w-xs text-sm leading-6 muted">
                Start the camera, capture one item and analyze the scan to see
                sorting and preparation advice.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5 flex items-start gap-3">
                <span className="rounded-xl bg-mint p-3 text-leaf">
                  <Recycle size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-black">{result.itemCategory}</h3>
                  <p className="mt-1 text-sm muted">{result.plasticType}</p>
                </div>
                <span className="pill">
                  {Math.round(result.confidence * 100)}% confidence
                </span>
              </div>

              <div className="mt-5 rounded-xl bg-cream p-4">
                <p className="text-xs font-extrabold uppercase tracking-wider muted">
                  Recommended action
                </p>
                <p className="mt-2 font-bold leading-6">{result.recommendedAction}</p>
              </div>

              <div className="mt-5">
                <h3 className="font-bold">Visual observations</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 muted">
                  {result.observations.map((observation, index) => (
                    <li key={index}>{observation}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-5">
                <h3 className="font-bold">Preparation steps</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 muted">
                  {result.preparationSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="mt-5">
                <h3 className="font-bold">Recyclability guidance</h3>
                <p className="mt-2 text-sm leading-6 muted">{result.recyclability}</p>
                <h3 className="mt-4 font-bold">Environmental context</h3>
                <p className="mt-2 text-sm leading-6 muted">{result.impact}</p>
              </div>

              {result.safetyWarning && (
                <div className="mt-5 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                  <AlertTriangle size={18} className="mt-1 shrink-0" />
                  {result.safetyWarning}
                </div>
              )}

              <p className="mt-4 text-xs muted">
                Live model: {result.aiModel} · AI result is advisory, not a
                certification.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setShowDisposalGuidance(value => !value)}
                  aria-expanded={showDisposalGuidance}
                  className="btn btn-primary w-full"
                >
                  <CheckCircle2 size={17} />
                  Dispose Responsibly
                </button>
                <Link href="/centres" className="btn btn-quiet w-full">
                  <MapPin size={17} />
                  Find Recycling Centres
                </Link>
              </div>

              {showDisposalGuidance && (
                <div className="mt-4 rounded-xl bg-mint p-4">
                  <p className="font-bold">Your responsible next step</p>
                  <p className="mt-2 text-sm leading-6">
                    {result.recommendedAction}
                  </p>
                  <p className="mt-3 text-xs leading-5 muted">
                    Scanning alone does not earn points or record a recycling
                    action.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </Shell>
  );
}
