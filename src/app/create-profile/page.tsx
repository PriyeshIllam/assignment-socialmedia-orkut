'use client'

import { useAuth } from '@/app/AuthProvider'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import './profile.scss'

const STORAGE_BUCKET = 'files' // or process.env.NEXT_STORAGE_LOC


function getStoragePathFromPublicUrl(publicUrl: string): string | null {
  try {
    const match = publicUrl.match(/object\/public\/[^/]+\/(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

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
  const [photoUrl_public, setProfilePhotoUrl] = useState<string>('')

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Check if profile already exists
  useEffect(() => {
    if (!user) return
    const checkProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking profile:', error.message)
        return
      }

      if (data) {
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

    if (!user) {
      alert('User not found. Please login again.')
      return
    }

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `images/${fileName}`

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath)

      if (!publicUrlData?.publicUrl) throw new Error('No public URL returned.')

      setPhotoUrl(publicUrlData.publicUrl)
      console.log('Uploaded image URL:', publicUrlData.publicUrl)
      alert('Image uploaded successfully!')
      if (publicUrlData.publicUrl) {
              const storagePath = getStoragePathFromPublicUrl(publicUrlData.publicUrl)
              if (storagePath) {
                const { data: signedUrlData, error: signedError } = await supabase.storage
                  .from(STORAGE_BUCKET)
                  .createSignedUrl(storagePath, 60 * 60 * 24) // 24 hours

                if (signedError) {
                  console.error('Error creating signed URL:', signedError.message)
                } else if (signedUrlData?.signedUrl) {
                  setProfilePhotoUrl(signedUrlData.signedUrl)
                }
              } else {
                console.warn('Invalid photo URL, cannot extract storage path.')
              }
            }

    } catch (error: any) {
      console.error('Error uploading image:', error.message)
      alert('Image upload failed: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('User not found. Cannot save profile.')
      return
    }

    setSaving(true)

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
          {photoUrl_public && (
            <img src={photoUrl_public} alt="Preview" className="preview-img" />
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
