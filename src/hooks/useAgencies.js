import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export function useAgencies() {
  const [agencies, setAgencies] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('list_my_agencies')
    if (!error) setAgencies(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createAgency = async (name, password) => {
    const { data, error } = await supabase.rpc('create_agency', {
      agency_name: name,
      agency_password: password,
    })
    if (!error) await refresh()
    return { id: data, error }
  }

  const renameAgency = async (id, newName) => {
    const { error } = await supabase.rpc('rename_agency', {
      target_agency_id: id,
      new_name: newName,
    })
    if (!error) await refresh()
    return { error }
  }

  const deleteAgency = async (id, password) => {
    const { error } = await supabase.rpc('delete_agency', {
      target_agency_id: id,
      agency_password: password,
    })
    if (!error) await refresh()
    return { error }
  }

  return { agencies, loading, refresh, createAgency, renameAgency, deleteAgency }
}
