import fs from 'fs';
import path from 'path';
import https from 'https';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const videoMappings = [
  {
    originalUrl: 'https://tjvgonysradvjybwjhsn.supabase.co/storage/v1/object/public/admin-media/1794527305002-yil6yu.mp4',
    localFilename: 'slider-hero-1.mp4'
  },
  {
    originalUrl: 'https://tjvgonysradvjybwjhsn.supabase.co/storage/v1/object/public/admin-media/1794527326232-l36ego.mp4',
    localFilename: 'slider-hero-2.mp4'
  },
  {
    originalUrl: 'https://tjvgonysradvjybwjhsn.supabase.co/storage/v1/object/public/admin-media/1794527348513-b5ya3q.mp4',
    localFilename: 'slider-hero-3.mp4'
  },
  {
    originalUrl: 'https://tjvgonysradvjybwjhsn.supabase.co/storage/v1/object/public/admin-media/1794527576804-ldfruf.mp4',
    localFilename: 'slider-affiliate-1.mp4'
  },
  {
    originalUrl: 'https://tjvgonysradvjybwjhsn.supabase.co/storage/v1/object/public/admin-media/1794527639249-mmwm3.mp4',
    localFilename: 'slider-affiliate-2.mp4'
  },
  {
    originalUrl: 'https://tjvgonysradvjybwjhsn.supabase.co/storage/v1/object/public/admin-media/1794527699461-jg51jc.mp4',
    localFilename: 'slider-affiliate-3.mp4'
  }
];

const destDir = path.join(process.cwd(), 'public', 'videos', 'sliders');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Handle redirect
        https.get(response.headers.location, (redirectRes) => {
          redirectRes.pipe(file);
          file.on('finish', () => file.close(resolve));
        }).on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
        return;
      }

      if (response.statusCode !== 200) {
        fs.unlink(destPath, () => {});
        return reject(new Error(`Failed to download ${url}: status code ${response.statusCode}`));
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log('Downloading slider videos locally to public/videos/sliders/ ...');
  for (const item of videoMappings) {
    const destPath = path.join(destDir, item.localFilename);
    const localUrl = `/videos/sliders/${item.localFilename}`;

    if (!fs.existsSync(destPath) || fs.statSync(destPath).size < 1000) {
      console.log(`Downloading ${item.originalUrl} -> ${item.localFilename}...`);
      await downloadFile(item.originalUrl, destPath);
      const sizeMB = (fs.statSync(destPath).size / (1024 * 1024)).toFixed(2);
      console.log(`Downloaded ${item.localFilename} (${sizeMB} MB)`);
    } else {
      console.log(`Already exists: ${item.localFilename}`);
    }

    // Update in Supabase slider_media
    console.log(`Updating slider_media: replacing ${item.originalUrl} with ${localUrl}...`);
    const { data, error } = await supabase
      .from('slider_media')
      .update({ media_url: localUrl })
      .eq('media_url', item.originalUrl)
      .select();

    if (error) {
      console.error(`Error updating slider_media for ${item.localFilename}:`, error);
    } else {
      console.log(`Updated ${data?.length || 0} rows for ${item.localFilename}`);
    }
  }

  console.log('All slider videos migrated to local static assets successfully!');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
