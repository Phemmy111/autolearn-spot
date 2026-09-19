import sys

file_path = "app/api/certificate/complete/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

text_to_replace = """    const videoProgressComplete = totalLessons > 0 && completedLessons === totalLessons

    // We will bypass strict assignment/quiz checks if they aren't tied to the product yet
    // Since we migrated to products, quizzes and assignments might still be on cohort_id
    // For now, if video progress is complete, we unlock the certificate!
    const assignmentsComplete = true 

    console.log('[cert/complete] Eligibility check:', {"""

replacement = """    const videoProgressComplete = totalLessons > 0 && completedLessons === totalLessons

    // We will bypass strict assignment/quiz checks if they aren't tied to the product yet
    // Since we migrated to products, quizzes and assignments might still be on cohort_id
    // For now, if video progress is complete, we unlock the certificate!
    const assignmentsComplete = true 

    console.log('[cert/complete] Eligibility check:', {
      productId,
      videoProgress: { completed: completedLessons, total: totalLessons, complete: videoProgressComplete }
    })

    if (!videoProgressComplete) {
      return NextResponse.json({
        error: 'Not eligible for certificate yet. Complete all lessons.',
        eligibility: {
          videoProgress: videoProgressComplete
        }
      }, { status: 400 })
    }

    console.log('[cert/complete] Passed Eligibility check:', {"""

new_content = content.replace(text_to_replace, replacement)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Added eligibility check back")
else:
    print("Could not find text to replace")
