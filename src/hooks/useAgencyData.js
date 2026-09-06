import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

const empty = {
  members: [],
  projects: [],
  expenses: [],
  photos: [],
  payouts: [],
  payoutLines: [],
  settings: null,
}

export function useAgencyData(agencyId) {
  const [state, setState] = useState(empty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAll = useCallback(async () => {
    if (!agencyId) return
    setLoading(true)
    setError(null)
    try {
      const [members, projects, payouts, settings] = await Promise.all([
        supabase.from('members').select('*').eq('agency_id', agencyId).order('name'),
        supabase
          .from('projects')
          .select('*')
          .eq('agency_id', agencyId)
          .order('ticket_no', { ascending: false }),
        supabase
          .from('payouts')
          .select('*')
          .eq('agency_id', agencyId)
          .order('date', { ascending: false }),
        supabase.from('settings').select('*').eq('agency_id', agencyId).single(),
      ])

      for (const r of [members, projects, payouts, settings]) {
        if (r.error) throw r.error
      }

      const projectIds = projects.data.map((p) => p.id)
      const payoutIds = payouts.data.map((p) => p.id)

      const [expenses, photos, payoutLines] = await Promise.all([
        projectIds.length
          ? supabase.from('expenses').select('*').in('project_id', projectIds)
          : { data: [] },
        projectIds.length
          ? supabase
              .from('photos')
              .select('*')
              .in('project_id', projectIds)
              .order('created_at', { ascending: false })
          : { data: [] },
        payoutIds.length
          ? supabase.from('payout_lines').select('*').in('payout_id', payoutIds)
          : { data: [] },
      ])

      for (const r of [expenses, photos, payoutLines]) {
        if (r.error) throw r.error
      }

      setState({
        members: members.data,
        projects: projects.data,
        expenses: expenses.data,
        photos: photos.data,
        payouts: payouts.data,
        payoutLines: payoutLines.data,
        settings: settings.data,
      })
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }, [agencyId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // ---- Projects ----
  async function addProject(fields) {
    const { error } = await supabase.from('projects').insert({ ...fields, agency_id: agencyId })
    if (error) throw error
    await loadAll()
  }
  async function updateProject(id, fields) {
    const { error } = await supabase.from('projects').update(fields).eq('id', id)
    if (error) throw error
    await loadAll()
  }
  async function deleteProject(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
    await loadAll()
  }

  // ---- Expenses ----
  async function addExpense(projectId, fields) {
    const { error } = await supabase.from('expenses').insert({ ...fields, project_id: projectId })
    if (error) throw error
    await loadAll()
  }
  async function deleteExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
    await loadAll()
  }

  // ---- Photos ----
  async function addPhoto(projectId, kind, url) {
    const { error } = await supabase.from('photos').insert({ project_id: projectId, kind, url })
    if (error) throw error
    await loadAll()
  }
  async function deletePhotoRow(id) {
    const { error } = await supabase.from('photos').delete().eq('id', id)
    if (error) throw error
    await loadAll()
  }

  // ---- Members ----
  async function addMember(fields) {
    const { error } = await supabase.from('members').insert({ ...fields, agency_id: agencyId })
    if (error) throw error
    await loadAll()
  }
  async function updateMember(id, fields) {
    const { error } = await supabase.from('members').update(fields).eq('id', id)
    if (error) throw error
    await loadAll()
  }
  async function deleteMember(id) {
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) throw error
    await loadAll()
  }

  // ---- Settings ----
  async function updateSettings(fields) {
    const { error } = await supabase.from('settings').update(fields).eq('agency_id', agencyId)
    if (error) throw error
    await loadAll()
  }

  // ---- Payroll ----
  async function recordPayout(lines, balance) {
    const memberAmounts = lines.map((l) => ({
      ...l,
      amount: Math.round((balance * l.percent) / 100),
    }))
    const totalAmount = memberAmounts.reduce((s, l) => s + l.amount, 0)

    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({ agency_id: agencyId, total_amount: totalAmount })
      .select()
      .single()
    if (payoutError) throw payoutError

    const lineRows = memberAmounts.map((l) => ({
      payout_id: payout.id,
      member_id: l.member_id,
      percent: l.percent,
      amount: l.amount,
    }))
    const { error: linesError } = await supabase.from('payout_lines').insert(lineRows)
    if (linesError) throw linesError

    await loadAll()
  }

  return {
    ...state,
    loading,
    error,
    reload: loadAll,
    addProject,
    updateProject,
    deleteProject,
    addExpense,
    deleteExpense,
    addPhoto,
    deletePhotoRow,
    addMember,
    updateMember,
    deleteMember,
    updateSettings,
    recordPayout,
  }
}
