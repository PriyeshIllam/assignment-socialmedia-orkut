'use client'

import { useAuth } from '@/app/AuthProvider'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import './profile.scss'

const STORAGE_BUCKET = 'files' // or process.env.NEXT_STORAGE_LOC

export default function CreateProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)

  // Wait for auth to load
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // ✅ Check if profile already exists
  useEffect(() => {
    if (!user) return
    const checkProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // Some other real error
        console.error('Error checking profile:', error.message)
        return
      }

      if (data) {
        // Profile already exists → redirect to home
        router.replace('/home')
      } else {
        setCheckingProfile(false)
      }
    }

    checkProfile()
  }, [user, router])
  

  if (loading || checkingProfile) return <p>Loading...</p>

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) setFile(selectedFile)
  }

  const handleUpload = async () => {
  if (!file) {
    alert('Please select an image first.')
    return
  }

  try {
    console.log('handle-upload')
    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `images/${fileName}`

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // ✅ Correct: destructure properly to get the URL
    const { data: publicUrlData, error: publicUrlError } =
      supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

    if (publicUrlError) throw publicUrlError
    if (!publicUrlData?.publicUrl) throw new Error('No public URL returned.')

    // ✅ Update photo preview
    setPhotoUrl(publicUrlData.publicUrl)
    console.log('Uploaded image URL:', publicUrlData.publicUrl)

    alert('Image uploaded successfully!')
  } catch (error: any) {
    console.error('Error uploading image:', error.message)
    alert('Image upload failed: ' + error.message)
  } finally {
    setUploading(false)
  }
}


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    console.log('photoUrl--', photoUrl)

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      display_name: displayName,
      photo_url: photoUrl || 'https://placekitten.com/200/200',
      status_message: status,
      location,
      bio,
    })

    if (error) {
      alert('Failed to create profile: ' + error.message)
      setSaving(false)
      return
    }

    router.push('/home')
  }

  return (
    <div className="create-profile-container">
      <h2>Create Your Orkut Profile</h2>
      <form onSubmit={handleSave} className="profile-form">
        <label>
          Display Name:
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </label>

        <label>
          Profile Picture:
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !file}
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
          {photoUrl && (
            <img src={photoUrl} alt="Preview" className="preview-img" />
          )}
        </label>

        <label>
          Status Message:
          <input
            type="text"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="What's on your mind?"
          />
        </label>

        <label>
          Location:
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
          />
        </label>

        <label>
          Bio:
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Create Profile'}
        </button>
      </form>
    </div>
  )
}
