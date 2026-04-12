import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const size = {
  width: 48,
  height: 48,
};
export const contentType = 'image/png';

const logoPath = join(process.cwd(), 'assets', 'logo.png');
const logoDataUri = `data:image/png;base64,${readFileSync(logoPath).toString('base64')}`;

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '9999px',
          background:
            'radial-gradient(circle at 30% 25%, #7fc1fb 0%, #42A5F5 55%, #1f78d1 100%)',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.24)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '78%',
            height: '78%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '9999px',
            background: 'rgba(255,255,255,0.94)',
          }}
        >
          <img
            src={logoDataUri}
            alt="Matriz 3D Studio"
            width={34}
            height={34}
            style={{
              objectFit: 'contain',
              borderRadius: '9999px',
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
