import {
  STATIC_CROPS,
  STATIC_DATASET_INFO,
  STATIC_EDA_ALL,
  STATIC_EDA_PER_CROP,
  STATIC_MODELS_COMPARE,
  STATIC_COUNTRIES,
  STATIC_SURFACES,
  STATIC_DIAGNOSTICS,
  predictClient
} from './staticData';

/**
 * Handle static fallbacks when running on GitHub Pages or when backend is unreachable
 */
export async function handleStaticFallback(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const parsed = new URL(urlStr, window.location.origin);
  const pathname = parsed.pathname;
  const searchParams = parsed.searchParams;
  const method = init?.method?.toUpperCase() || 'GET';

  // 1. Crops
  if (pathname.includes('/crops')) {
    return new Response(JSON.stringify(STATIC_CROPS), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Dataset Info
  if (pathname.includes('/dataset-info')) {
    return new Response(JSON.stringify(STATIC_DATASET_INFO), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Predict (POST)
  if (pathname.includes('/predict') && method === 'POST') {
    let body: any = {};
    try {
      if (typeof init?.body === 'string') {
        body = JSON.parse(init.body);
      }
    } catch {}

    const crop = body.crop || 'Wheat';
    const model = body.model || 'multiple_linear';
    const year = Number(body.year) || 2005;
    const rainfall = Number(body.rainfall) || 800;
    const pesticides = Number(body.pesticides) || 10000;
    const temp = Number(body.temp) || 20;

    const result = predictClient(crop, model, year, rainfall, pesticides, temp);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 4. EDA
  if (pathname.includes('/eda')) {
    const cropParam = searchParams.get('crop');
    if (!cropParam || cropParam.toLowerCase() === 'all' || cropParam.toLowerCase() === 'all crops') {
      return new Response(JSON.stringify(STATIC_EDA_ALL), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const cropEda = STATIC_EDA_PER_CROP[cropParam] || STATIC_EDA_PER_CROP['Wheat'] || STATIC_EDA_ALL;
    return new Response(JSON.stringify(cropEda), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. Models compare
  if (pathname.includes('/models/compare')) {
    const cropParam = searchParams.get('crop') || 'Wheat';
    const models = STATIC_MODELS_COMPARE[cropParam] || STATIC_MODELS_COMPARE['Wheat'] || [];
    return new Response(JSON.stringify({ models }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 6. Countries
  if (pathname.includes('/countries')) {
    const cropParam = searchParams.get('crop') || 'Wheat';
    const data = STATIC_COUNTRIES || [];
    return new Response(JSON.stringify({ countries: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 7. Surface
  if (pathname.includes('/surface')) {
    const cropParam = searchParams.get('crop') || 'Wheat';
    const surface = (STATIC_SURFACES as any)[cropParam] || (STATIC_SURFACES as any)['Wheat'] || {};
    return new Response(JSON.stringify(surface), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 8. Scenario
  if (pathname.includes('/scenario')) {
    const cropParam = searchParams.get('crop') || 'Wheat';
    const delta = parseFloat(searchParams.get('delta') || '1.0');
    const base = (STATIC_EDA_PER_CROP[cropParam]?.ranges?.avg_yield) || 2.0;
    const changePct = Number((-delta * 4.2).toFixed(1));
    const predicted = Number((base * (1 + changePct / 100)).toFixed(2));

    return new Response(JSON.stringify({
      crop: cropParam,
      delta_temp: delta,
      baseline_yield: base,
      predicted_yield: predicted,
      percent_change: changePct
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 9. Diagnostics
  const diag = (STATIC_DIAGNOSTICS as any)['Wheat'] || {};
  if (pathname.includes('/actual-vs-predicted')) {
    return new Response(JSON.stringify(diag.actual_vs_predicted || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (pathname.includes('/residuals')) {
    return new Response(JSON.stringify(diag.residuals || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (pathname.includes('/feature-importance')) {
    return new Response(JSON.stringify(diag.feature_importance || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (pathname.includes('/nonlinear-fits')) {
    return new Response(JSON.stringify(diag.nonlinear_fits || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (pathname.includes('/bias-variance')) {
    const degree = parseInt(searchParams.get('degree') || '2', 10);
    const item = (diag.bias_variance || []).find((b: any) => b.degree === degree) || (diag.bias_variance || [])[1] || {};
    return new Response(JSON.stringify(item), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // Default empty object
  return new Response(JSON.stringify({ message: 'Static fallback response', path: pathname }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Install global fetch interceptor
 */
export function setupFetchInterceptor() {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Check if it's an API request
    if (urlStr.includes('/api/')) {
      // If we are hosted on GitHub Pages, directly use static fallback
      if (window.location.hostname.includes('github.io')) {
        return handleStaticFallback(input, init);
      }

      // Locally, attempt the real backend first; fallback if server unreachable
      try {
        const res = await originalFetch(input, init);
        if (res.ok) return res;
        return handleStaticFallback(input, init);
      } catch (err) {
        return handleStaticFallback(input, init);
      }
    }

    return originalFetch(input, init);
  };
}
