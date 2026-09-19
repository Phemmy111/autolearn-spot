import sys

file_path = "hooks/useProgress.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

text_to_replace = """      // Optimistic update
      if (!completedIds.includes(lessonId)) {
        setCompletedIds((prev) => [...prev, lessonId])
        fetch('/api/certificate/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseSlug, lessonId }),
        })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            window.dispatchEvent(new Event('certificate-unlocked'))
          }
        })
        .catch((err) => console.error('Failed to process certificate:', err))
      }"""

replacement = """      // Optimistic update
      if (!completedIds.includes(lessonId)) {
        setCompletedIds((prev) => [...prev, lessonId])
      }
      
      // Always attempt to check certificate completion when a video finishes, 
      // in case it failed previously due to network or was migrated
      fetch('/api/certificate/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug, lessonId }),
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          window.dispatchEvent(new Event('certificate-unlocked'))
        }
      })
      .catch((err) => console.error('Failed to process certificate:', err))
"""

new_content = content.replace(text_to_replace, replacement)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed useProgress.ts")
else:
    print("Could not find text in useProgress.ts")
