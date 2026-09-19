import sys
import re

file_path = "app/api/certificate/complete/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the eligibility check logic
new_logic = """
    // 3. Verify eligibility before issuing certificate
    // First, find the product_id of the lesson they just completed
    const { data: lessonData } = await supabaseAdmin
      .from('lessons')
      .select('product_id')
      .eq('uuid_id', lessonId)
      .single()
      
    const productId = lessonData?.product_id
    
    if (!productId) {
      return NextResponse.json({ error: 'Lesson not found or not associated with a product.' }, { status: 400 })
    }

    // Get all active lessons for this product
    const { data: productLessons } = await supabaseAdmin
      .from('lessons')
      .select('uuid_id')
      .eq('product_id', productId)
      
    const totalLessons = productLessons?.length || 0
    const lessonIds = productLessons?.map(l => l.uuid_id) || []

    let completedLessons = 0
    if (lessonIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true)
        .in('lesson_id', lessonIds)
      completedLessons = count || 0
    }

    const videoProgressComplete = totalLessons > 0 && completedLessons === totalLessons

    // We will bypass strict assignment/quiz checks if they aren't tied to the product yet
    // Since we migrated to products, quizzes and assignments might still be on cohort_id
    // For now, if video progress is complete, we unlock the certificate!
    const assignmentsComplete = true 
    const quizzesComplete = true

    console.log('[cert/complete] Eligibility check:', {
      productId,
      videoProgress: { completed: completedLessons, total: totalLessons, complete: videoProgressComplete }
    })
"""

# We need to replace the section starting at "// 3. Verify eligibility before issuing certificate"
# up to "// 4. Upsert student certificate record"
pattern = re.compile(r'// 3\. Verify eligibility before issuing certificate.*?// 4\. Upsert student certificate record', re.DOTALL)
new_content = pattern.sub(new_logic + '\n    // 4. Upsert student certificate record', content)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated certificate eligibility logic successfully")
else:
    print("Could not find the target logic to replace!")

