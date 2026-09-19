import sys

file_path = "components/author/YouTubeResumableUploader.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """      xhr.onerror = () => {
        onError('Network error during upload');
        setStatusText('Network error.');
        setUploading(false);
      };"""

replacement = """      xhr.onerror = async () => {
        // If we hit a CORS error, the browser blocked the response but the upload might have succeeded.
        // We can verify this by checking the status via our own backend proxy.
        setStatusText('Verifying upload with Google...');
        try {
          const checkRes = await fetch('/api/author/integrations/youtube/upload-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadUrl, fileSize: file.size })
          });
          const checkData = await checkRes.json();
          if (checkData.success && checkData.videoId) {
            const videoUrl = `https://www.youtube.com/watch?v=${checkData.videoId}`;
            onSuccess(checkData.videoId, videoUrl);
            setStatusText('Successfully uploaded to YouTube.');
            setProgress(100);
            setUploading(false);
            return;
          }
        } catch(e) {
          console.error('Failed to verify upload status', e);
        }

        onError('Network error during upload (CORS blocked the response).');
        setStatusText('Network error.');
        setUploading(false);
      };"""

new_content = content.replace(target, replacement)
if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Injected status checker successfully!")
else:
    print("Could not find the target string.")
