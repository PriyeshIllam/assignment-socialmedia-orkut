'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import './profile.scss'

export default function CreateProfilePage() {
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('You must be logged in to create a profile.')
      setLoading(false)
      return
    }

    let avatar_url = null

    if (avatar) {
      const fileExt = avatar.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatar, { upsert: true })

      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      avatar_url = data.publicUrl
    }

    const { error: insertError } = await supabase.from('profiles').upsert({
      id: user.id,
      username,
      bio,
      avatar_url,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    router.push('/posts') // redirect after profile creation
  }

  return (
    <div className="profile-container">
      <h1>Create Your Profile</h1>
      <form onSubmit={handleSubmit} className="profile-form">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          placeholder="Your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          placeholder="Tell us about yourself..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <label htmlFor="avatar">Avatar (optional)</label>
        <input
          id="avatar"
          type="file"
          accept="image/*"
          onChange={(e) => setAvatar(e.target.files?.[0] || null)}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Create Profile'}
        </button>
      </form>
    </div>
  )
}
