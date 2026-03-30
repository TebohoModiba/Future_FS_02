import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Select, MenuItem, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Button,
  AppBar, Toolbar, Avatar, Tooltip, Snackbar, Alert, CircularProgress,
  Fade, Badge, Divider, InputAdornment, Chip, ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Logout, NoteAdd, Search, PeopleAlt, TrendingUp, NewReleases,
  CheckCircle, Refresh, PersonAdd, DeleteOutline, FilterList,
  ArrowUpward, ArrowDownward,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";

const API_BASE = "http://localhost:5000/api";

const STATUS_CONFIG = {
  new:       { bg: "#e3f2fd", text: "#1565c0", label: "New" },
  contacted: { bg: "#fff8e1", text: "#f57f17", label: "Contacted" },
  converted: { bg: "#e8f5e9", text: "#2e7d32", label: "Converted" },
};

const EMPTY_FORM = { name: "", email: "", phone: "" };

// ── Helpers ────────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem("token"); }

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch { return true; }
}

// ── StatCard ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon, active, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      flex: 1, minWidth: 140, background: active ? color : "#fff",
      borderRadius: 3, p: 2.5, boxShadow: active ? `0 4px 20px ${color}44` : "0 2px 12px rgba(0,0,0,0.07)",
      display: "flex", alignItems: "center", gap: 2,
      border: `1.5px solid ${active ? color : color + "22"}`,
      transition: "all 0.2s", cursor: onClick ? "pointer" : "default",
      "&:hover": onClick ? { boxShadow: `0 4px 20px ${color}44`, transform: "translateY(-1px)" } : {},
    }}
  >
    <Box sx={{ width: 48, height: 48, borderRadius: 2.5, background: active ? "rgba(255,255,255,0.25)" : `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: active ? "#fff" : color, fontSize: 26 }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" fontWeight={700} color={active ? "#fff" : "text.primary"} lineHeight={1}>{value}</Typography>
      <Typography variant="caption" fontWeight={500} sx={{ color: active ? "rgba(255,255,255,0.85)" : "text.secondary" }}>{label}</Typography>
    </Box>
  </Box>
);

// ── Main Component ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  // Notes
  const [notesDialog, setNotesDialog] = useState({ open: false, lead: null });
  const [noteInput, setNoteInput] = useState("");

  // Add Lead
  const [addDialog, setAddDialog] = useState(false);
  const [leadForm, setLeadForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [addingLead, setAddingLead] = useState(false);

  // Delete
  const [deleteDialog, setDeleteDialog] = useState({ open: false, lead: null });
  const [deletingId, setDeletingId] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [updatingId, setUpdatingId] = useState(null);

  const authHeaders = () => {
    const token = getToken();
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("token");
      navigate("/login");
      return null;
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    const headers = authHeaders();
    if (!headers) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/leads`, headers);
      setLeads(res.data);
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem("token"); navigate("/login"); }
      else showSnackbar("Failed to fetch leads.", "error");
    } finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  // ── Status Change ────────────────────────────────────────────────────────
  const handleStatusChange = async (id, newStatus) => {
    const headers = authHeaders();
    if (!headers) return;
    setUpdatingId(id);
    try {
      await axios.put(`${API_BASE}/leads/${id}`, { status: newStatus }, headers);
      setLeads((prev) => prev.map((l) => l._id === id ? { ...l, status: newStatus } : l));
      showSnackbar(`Status updated to "${STATUS_CONFIG[newStatus]?.label}"`);
    } catch { showSnackbar("Failed to update status.", "error"); }
    finally { setUpdatingId(null); }
  };

  // ── Notes ────────────────────────────────────────────────────────────────
  const handleOpenNotes = (lead) => { setNotesDialog({ open: true, lead }); setNoteInput(""); };

  const handleAddNote = async () => {
    const { lead } = notesDialog;
    if (!noteInput.trim()) return;
    const headers = authHeaders();
    if (!headers) return;
    try {
      await axios.put(`${API_BASE}/leads/${lead._id}`, { notes: noteInput.trim() }, headers);
      setLeads((prev) => prev.map((l) =>
        l._id === lead._id
          ? { ...l, notes: [...(l.notes || []), { text: noteInput.trim(), date: new Date() }] }
          : l
      ));
      showSnackbar("Note added!");
      setNotesDialog({ open: false, lead: null });
    } catch { showSnackbar("Failed to add note.", "error"); }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    const { lead } = deleteDialog;
    const headers = authHeaders();
    if (!headers) return;
    setDeletingId(lead._id);
    try {
      await axios.delete(`${API_BASE}/leads/${lead._id}`, headers);
      setLeads((prev) => prev.filter((l) => l._id !== lead._id));
      showSnackbar(`"${lead.name}" deleted.`, "info");
      setDeleteDialog({ open: false, lead: null });
    } catch { showSnackbar("Failed to delete lead.", "error"); }
    finally { setDeletingId(null); }
  };

  // ── Add Lead ─────────────────────────────────────────────────────────────
  const validateForm = () => {
    const errors = {};
    if (!leadForm.name.trim()) errors.name = "Name is required";
    if (!leadForm.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadForm.email)) errors.email = "Enter a valid email";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddDialog = () => { setLeadForm(EMPTY_FORM); setFormErrors({}); setAddDialog(true); };

  const handleAddLead = async () => {
    if (!validateForm()) return;
    setAddingLead(true);
    try {
      const res = await axios.post(`${API_BASE}/leads`, {
        name: leadForm.name.trim(),
        email: leadForm.email.trim(),
        phone: leadForm.phone.trim(),
      });
      setLeads((prev) => [res.data, ...prev]);
      showSnackbar(`"${leadForm.name}" added!`);
      setAddDialog(false);
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Failed to add lead.", "error");
    } finally { setAddingLead(false); }
  };

  const handleFormChange = (field) => (e) => {
    setLeadForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ── Sort ─────────────────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === "asc"
      ? <ArrowUpward sx={{ fontSize: 12, ml: 0.5 }} />
      : <ArrowDownward sx={{ fontSize: 12, ml: 0.5 }} />;
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };

  // ── Filtered + Sorted leads ───────────────────────────────────────────────
  const processed = leads
    .filter((l) => statusFilter === "all" || l.status === statusFilter)
    .filter((l) =>
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search)
    )
    .sort((a, b) => {
      let valA = a[sortField], valB = b[sortField];
      if (sortField === "createdAt") { valA = new Date(valA); valB = new Date(valB); }
      else { valA = valA?.toLowerCase?.() ?? ""; valB = valB?.toLowerCase?.() ?? ""; }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    converted: leads.filter((l) => l.status === "converted").length,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: "100vh", background: "#f5f6fa" }}>

      {/* ── Topbar ── */}
      <AppBar position="sticky" elevation={0} sx={{ background: "#fff", borderBottom: "1px solid #e8eaf0", color: "text.primary" }}>
        <Toolbar sx={{ gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            <PeopleAlt sx={{ color: "#2563eb", fontSize: 28 }} />
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: "-0.5px", color: "#111827" }}>LeadFlow</Typography>
            <Chip label="CRM" size="small" sx={{ background: "#eff6ff", color: "#2563eb", fontWeight: 700, fontSize: 10, ml: 0.5 }} />
          </Box>
          <Button
            variant="contained" startIcon={<PersonAdd />} onClick={handleOpenAddDialog} size="small"
            sx={{ background: "#2563eb", "&:hover": { background: "#1d4ed8" }, borderRadius: 2, textTransform: "none", fontWeight: 700, px: 2 }}
          >
            Add Lead
          </Button>
          <Tooltip title="Refresh"><IconButton onClick={fetchLeads} size="small" sx={{ color: "#6b7280" }}><Refresh /></IconButton></Tooltip>
          <Tooltip title="Logout"><IconButton onClick={handleLogout} size="small" sx={{ color: "#6b7280" }}><Logout /></IconButton></Tooltip>
          <Avatar sx={{ width: 34, height: 34, background: "#2563eb", fontSize: 14, fontWeight: 700, ml: 1 }}>A</Avatar>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>

        {/* ── Stats (clickable filters) ── */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 4 }}>
          <StatCard label="Total Leads" value={stats.total} color="#2563eb" icon={<PeopleAlt />} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
          <StatCard label="New" value={stats.new} color="#1565c0" icon={<NewReleases />} active={statusFilter === "new"} onClick={() => setStatusFilter("new")} />
          <StatCard label="Contacted" value={stats.contacted} color="#f57f17" icon={<TrendingUp />} active={statusFilter === "contacted"} onClick={() => setStatusFilter("contacted")} />
          <StatCard label="Converted" value={stats.converted} color="#2e7d32" icon={<CheckCircle />} active={statusFilter === "converted"} onClick={() => setStatusFilter("converted")} />
        </Box>

        {/* ── Table Card ── */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e8eaf0", overflow: "hidden" }}>

          {/* Table toolbar */}
          <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", borderBottom: "1px solid #f0f0f0" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {statusFilter === "all" ? "All Leads" : `${STATUS_CONFIG[statusFilter]?.label} Leads`}
              </Typography>
              <Badge badgeContent={processed.length} color="primary" sx={{ "& .MuiBadge-badge": { fontSize: 10, position: "relative", transform: "none", ml: 1 } }} />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              {/* Status filter pills */}
              <ToggleButtonGroup
                value={statusFilter}
                exclusive
                onChange={(_, val) => val && setStatusFilter(val)}
                size="small"
                sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontSize: 12, fontWeight: 600, px: 1.5, py: 0.5, border: "1px solid #e5e7eb", "&.Mui-selected": { background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" } } }}
              >
                <ToggleButton value="all"><FilterList sx={{ fontSize: 14, mr: 0.5 }} />All</ToggleButton>
                <ToggleButton value="new">New</ToggleButton>
                <ToggleButton value="contacted">Contacted</ToggleButton>
                <ToggleButton value="converted">Converted</ToggleButton>
              </ToggleButtonGroup>

              {/* Search */}
              <TextField
                size="small" placeholder="Search…" value={search}
                onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 200 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: "#9ca3af", fontSize: 18 }} /></InputAdornment> }}
              />
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={36} thickness={4} /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: "#fafafa" }}>
                    {[
                      { label: "Name", field: "name", sortable: true },
                      { label: "Email", field: "email", sortable: true },
                      { label: "Phone", field: null, sortable: false },
                      { label: "Status", field: "status", sortable: true },
                      { label: "Date Added", field: "createdAt", sortable: true },
                      { label: "Latest Note", field: null, sortable: false },
                      { label: "Actions", field: null, sortable: false },
                    ].map(({ label, field, sortable }) => (
                      <TableCell
                        key={label}
                        onClick={sortable ? () => handleSort(field) : undefined}
                        sx={{
                          fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5,
                          color: sortField === field ? "#2563eb" : "#6b7280",
                          borderBottom: "1px solid #f0f0f0", py: 1.5,
                          cursor: sortable ? "pointer" : "default",
                          userSelect: "none",
                          "&:hover": sortable ? { color: "#2563eb" } : {},
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {label}<SortIcon field={field} />
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processed.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 8, color: "#9ca3af" }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                          <PeopleAlt sx={{ fontSize: 40, color: "#d1d5db" }} />
                          <Typography fontSize={14}>
                            {search || statusFilter !== "all"
                              ? "No leads match your filters."
                              : `No leads yet — click "Add Lead" to get started.`}
                          </Typography>
                          {(search || statusFilter !== "all") && (
                            <Button size="small" onClick={() => { setSearch(""); setStatusFilter("all"); }} sx={{ textTransform: "none", fontSize: 12 }}>
                              Clear filters
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    processed.map((lead, i) => {
                      const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG["new"];
                      const latestNote = lead.notes?.length > 0
                        ? lead.notes[lead.notes.length - 1]?.text
                        : null;
                      return (
                        <Fade in key={lead._id} timeout={200 + i * 40}>
                          <TableRow sx={{ "&:hover": { background: "#f8faff" }, transition: "background 0.15s" }}>
                            <TableCell sx={{ fontWeight: 600, color: "#111827" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, background: "#eff6ff", color: "#2563eb" }}>
                                  {lead.name?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                {lead.name}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: "#374151", fontSize: 13 }}>{lead.email}</TableCell>
                            <TableCell sx={{ color: "#374151", fontSize: 13 }}>{lead.phone || "—"}</TableCell>
                            <TableCell>
                              <Select
                                value={lead.status || "new"} size="small"
                                disabled={updatingId === lead._id}
                                onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                                sx={{ fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.text, borderRadius: 2, "& .MuiOutlinedInput-notchedOutline": { border: "none" }, "& .MuiSelect-icon": { color: cfg.text } }}
                              >
                                {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                                  <MenuItem key={val} value={val} sx={{ fontSize: 13 }}>{label}</MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell sx={{ color: "#6b7280", fontSize: 12 }}>
                              {lead.createdAt ? format(new Date(lead.createdAt), "dd MMM yyyy") : "—"}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#6b7280", fontSize: 12, fontStyle: latestNote ? "normal" : "italic" }}>
                              <Tooltip title={latestNote || ""} placement="top">
                                <span>{latestNote || "No notes yet"}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Tooltip title="Add note">
                                  <IconButton size="small" onClick={() => handleOpenNotes(lead)} sx={{ color: "#2563eb", background: "#eff6ff", borderRadius: 2, "&:hover": { background: "#dbeafe" } }}>
                                    <NoteAdd fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete lead">
                                  <IconButton size="small" onClick={() => setDeleteDialog({ open: true, lead })} sx={{ color: "#dc2626", background: "#fef2f2", borderRadius: 2, "&:hover": { background: "#fee2e2" } }}>
                                    <DeleteOutline fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        </Fade>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* ── Add Lead Dialog ── */}
      <Dialog open={addDialog} onClose={() => !addingLead && setAddDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <PersonAdd fontSize="small" />
            </Box>
            <Box>
              <Typography fontWeight={700} fontSize={16}>New Lead</Typography>
              <Typography variant="caption" color="text.secondary">Fill in the contact details below</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <Divider sx={{ mt: 2 }} />
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Full Name" fullWidth autoFocus value={leadForm.name} onChange={handleFormChange("name")} error={!!formErrors.name} helperText={formErrors.name} placeholder="e.g. Jane Smith" />
          <TextField label="Email Address" fullWidth type="email" value={leadForm.email} onChange={handleFormChange("email")} error={!!formErrors.email} helperText={formErrors.email} placeholder="e.g. jane@example.com" />
          <TextField label="Phone Number (optional)" fullWidth value={leadForm.phone} onChange={handleFormChange("phone")} placeholder="e.g. 0821234567" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setAddDialog(false)} disabled={addingLead} sx={{ color: "#6b7280", textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddLead} disabled={addingLead}
            startIcon={addingLead ? <CircularProgress size={16} color="inherit" /> : <PersonAdd />}
            sx={{ background: "#2563eb", "&:hover": { background: "#1d4ed8" }, borderRadius: 2, textTransform: "none", fontWeight: 700, px: 3 }}
          >
            {addingLead ? "Adding…" : "Add Lead"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={deleteDialog.open} onClose={() => !deletingId && setDeleteDialog({ open: false, lead: null })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography fontWeight={700} fontSize={16}>Delete Lead</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Typography fontSize={14} color="text.secondary">
            Are you sure you want to delete{" "}
            <Typography component="span" fontWeight={700} color="text.primary">{deleteDialog.lead?.name}</Typography>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDeleteDialog({ open: false, lead: null })} disabled={!!deletingId} sx={{ color: "#6b7280", textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmDelete} disabled={!!deletingId}
            startIcon={deletingId ? <CircularProgress size={16} color="inherit" /> : <DeleteOutline />}
            sx={{ background: "#dc2626", "&:hover": { background: "#b91c1c" }, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            {deletingId ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Notes Dialog ── */}
      <Dialog open={notesDialog.open} onClose={() => setNotesDialog({ open: false, lead: null })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography fontWeight={700}>Add Note — {notesDialog.lead?.name}</Typography>
          {notesDialog.lead?.notes?.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>LATEST NOTE</Typography>
              <Box sx={{ mt: 0.5, p: 1.5, background: "#f9fafb", borderRadius: 2, border: "1px solid #e5e7eb", fontSize: 13, color: "#374151" }}>
                {notesDialog.lead.notes[notesDialog.lead.notes.length - 1]?.text}
              </Box>
            </Box>
          )}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <TextField label="New Note" multiline rows={4} fullWidth value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Type your follow-up note here…" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setNotesDialog({ open: false, lead: null })} sx={{ color: "#6b7280", textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddNote} disabled={!noteInput.trim()}
            sx={{ background: "#2563eb", "&:hover": { background: "#1d4ed8" }, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            Save Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2, fontWeight: 600 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}