import { useEffect, useState } from 'react';
import { areasApi, packagesApi } from '../services/api';

export interface PackageOption {
  id?: string;
  name: string;
  speed: string;
  price: number;
}

/**
 * Loads the real, admin-managed Areas and Packages for the customer
 * connection dropdowns. Both are stored on the customer record as plain
 * strings (area = area name, package = speed string such as "10 Mbps"), so
 * the dropdown value for an area is its name and for a package is its speed.
 *
 * If the API call fails we fall back to a small static list so the form stays
 * usable, but surface a warning so the operator knows the data is stale.
 */
const FALLBACK_AREAS = ['Sector A', 'Sector B', 'Sector C', 'Sector D', 'Sector E', 'Sector F'];
const FALLBACK_PACKAGES: PackageOption[] = [
  { name: '5 Mbps', speed: '5 Mbps', price: 500 },
  { name: '10 Mbps', speed: '10 Mbps', price: 1000 },
  { name: '20 Mbps', speed: '20 Mbps', price: 1500 },
  { name: '30 Mbps', speed: '30 Mbps', price: 2000 },
  { name: '50 Mbps', speed: '50 Mbps', price: 3000 },
  { name: '100 Mbps', speed: '100 Mbps', price: 5000 },
];

const caseInsensitiveSort = (a: string, b: string) =>
  a.localeCompare(b, undefined, { sensitivity: 'base' });

export function useDropdownData() {
  const [areas, setAreas] = useState<string[]>(FALLBACK_AREAS);
  const [packages, setPackages] = useState<PackageOption[]>(FALLBACK_PACKAGES);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      let failed = false;

      const areasRes = await areasApi.getAll({ limit: 100 });
      if (areasRes.success && Array.isArray(areasRes.data?.data) && areasRes.data.data.length > 0) {
        const names = areasRes.data.data
          .map((a: any) => (a?.name ?? '').toString().trim())
          .filter(Boolean)
          .sort(caseInsensitiveSort);
        const seen = new Set<string>();
        const unique: string[] = [];
        for (const n of names) {
          const key = n.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(n);
          }
        }
        if (unique.length > 0) setAreas(unique);
        else failed = true;
      } else {
        failed = true;
      }

      const pkgsRes = await packagesApi.getAll({ limit: 100 });
      if (pkgsRes.success && Array.isArray(pkgsRes.data?.data) && pkgsRes.data.data.length > 0) {
        const opts: PackageOption[] = pkgsRes.data.data
          .map((p: any) => ({
            id: p?.id,
            name: (p?.name ?? '').toString().trim(),
            speed: (p?.speed ?? '').toString().trim(),
            price: Number(p?.price ?? 0),
          }))
          .filter((p: PackageOption) => p.speed || p.name)
          .sort((a: PackageOption, b: PackageOption) => a.price - b.price);
        if (opts.length > 0) setPackages(opts);
        else failed = true;
      } else {
        failed = true;
      }

      if (failed) {
        setWarning('Could not load the latest Areas/Packages from the server. Showing default options — please retry or check your connection.');
        console.warn('useDropdownData: areas/packages fetch incomplete', areasRes, pkgsRes);
      }
      if (alive) {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { areas, packages, loading, warning };
}
