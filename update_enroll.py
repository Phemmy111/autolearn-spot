import sys

file_path = "components/enroll-modal.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

text_to_replace = """function paymentHref(form: HTMLFormElement) {
  const data = new FormData(form)
  const url = new URL(paymentUrl)
  const name = String(data.get('name') || '')
  const email = String(data.get('email') || '')
  const phone = String(data.get('phone') || '')
  const referral = String(data.get('referral') || '')

  if (name) url.searchParams.set('name', name)
  if (email) url.searchParams.set('email', email)"""

replacement = """function paymentHref(form: HTMLFormElement) {
  const data = new FormData(form)
  const url = new URL(paymentUrl)
  const firstName = String(data.get('firstName') || '')
  const lastName = String(data.get('lastName') || '')
  const name = `${firstName} ${lastName}`.trim()
  const email = String(data.get('email') || '')
  const phone = String(data.get('phone') || '')
  const referral = String(data.get('referral') || '')

  if (name) url.searchParams.set('name', name)
  if (firstName) url.searchParams.set('first_name', firstName)
  if (lastName) url.searchParams.set('last_name', lastName)
  if (email) url.searchParams.set('email', email)"""

new_content = content.replace(text_to_replace, replacement)

text_to_replace_2 = """    const data = new FormData(form)
    const payload = JSON.stringify({
      "Full Name": String(data.get('name') || ''),
      "Email1": String(data.get('email') || ''),
      "Phone": String(data.get('phone') || ''),
      "ReferralCode": String(data.get('referral') || '')
    })"""

replacement_2 = """    const data = new FormData(form)
    const firstName = String(data.get('firstName') || '')
    const lastName = String(data.get('lastName') || '')
    const payload = JSON.stringify({
      "First Name": firstName,
      "Last Name": lastName,
      "Full Name": `${firstName} ${lastName}`.trim(),
      "Email1": String(data.get('email') || ''),
      "Phone": String(data.get('phone') || ''),
      "ReferralCode": String(data.get('referral') || '')
    })"""

new_content = new_content.replace(text_to_replace_2, replacement_2)

text_to_replace_3 = """                <form className="relative space-y-4" onSubmit={onSubmit}>
                  <label className="block">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                      Full Name *
                    </span>
                    <input
                      className="mt-2 h-12 w-full border border-brand-border bg-brand-bg px-4 font-mono text-sm text-[#e2e2e8] outline-none transition placeholder:text-[#5d5f63] focus:border-[#10b981] focus:bg-brand-bg"
                      name="name"
                      placeholder="e.g., Chioma Adeleke"
                      required
                      type="text"
                    />
                  </label>"""

replacement_3 = """                <form className="relative space-y-4" onSubmit={onSubmit}>
                  <div className="flex gap-4">
                    <label className="block w-1/2">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                        First Name *
                      </span>
                      <input
                        className="mt-2 h-12 w-full border border-brand-border bg-brand-bg px-4 font-mono text-sm text-[#e2e2e8] outline-none transition placeholder:text-[#5d5f63] focus:border-[#10b981] focus:bg-brand-bg"
                        name="firstName"
                        placeholder="e.g., Chioma"
                        required
                        type="text"
                      />
                    </label>
                    <label className="block w-1/2">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                        Last Name *
                      </span>
                      <input
                        className="mt-2 h-12 w-full border border-brand-border bg-brand-bg px-4 font-mono text-sm text-[#e2e2e8] outline-none transition placeholder:text-[#5d5f63] focus:border-[#10b981] focus:bg-brand-bg"
                        name="lastName"
                        placeholder="e.g., Adeleke"
                        required
                        type="text"
                      />
                    </label>
                  </div>"""

new_content = new_content.replace(text_to_replace_3, replacement_3)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated enroll-modal.tsx")
else:
    print("Could not find text to replace in enroll-modal")
