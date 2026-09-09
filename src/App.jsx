import React, { useState, useEffect, useRef } from "react";
import { subscribeCollection, setItem, updateItem, deleteItem, arrayUnion, arrayRemove } from "./storage";
import { compressImage } from "./imageUtils";

const MEMBERS = [
  { id: "guifre", name: "Guifré", color: "#4a5d3a" },
  { id: "edu", name: "Edu", color: "#7c5b8e" },
  { id: "pol", name: "Pol", color: "#8a6f3f" },
  { id: "evan", name: "Evan", color: "#3f6b5e" },
  { id: "ot", name: "Ot", color: "#9a4f4f" },
  { id: "vaque", name: "Vaqué", color: "#5f7a9a" },
  { id: "tell", name: "Tell", color: "#8e6b9a" },
  { id: "oleguer", name: "Oleguer", color: "#6a8a3f" },
  { id: "magi", name: "Magí", color: "#a17a3f" },
  { id: "jv", name: "JV", color: "#4f7a8a" },
  { id: "roc", name: "Roc", color: "#7a4f5f" },
  { id: "pepitu", name: "Pepitu", color: "#5f8a6a" },
  { id: "jesus", name: "Jesus", color: "#8a5f3f" },
];

function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const SEED_RECORDS = [
  { id: "seed1", title: "Capvespre a la finca", date: "", place: "La finca", description: "Exemple de record — edita'l o esborra'l quan tinguis contingut real.", photo: "/img/finca.jpg", authorId: "guifre", likes: [], createdAt: 4 },
  { id: "seed2", title: "Nit de foguera", date: "", place: "", description: "Exemple de record — edita'l o esborra'l quan tinguis contingut real.", photo: "/img/bonfire.jpg", authorId: "pol", likes: [], createdAt: 3 },
  { id: "seed3", title: "Vermut amb vistes", date: "", place: "", description: "Exemple de record — edita'l o esborra'l quan tinguis contingut real.", photo: "/img/chairs.jpg", authorId: "edu", likes: [], createdAt: 2 },
  { id: "seed4", title: "Mudança de mobles", date: "", place: "", description: "Exemple de record — edita'l o esborra'l quan tinguis contingut real.", photo: "/img/moving.jpg", authorId: "evan", likes: [], createdAt: 1 },
];

const inputStyle = { padding: "8px", borderRadius: "8px", border: "1px solid #ccc", fontFamily: "inherit", flex: 1, boxSizing: "border-box" };

function byCreatedDesc(a, b) {
  return (b.createdAt || 0) - (a.createdAt || 0);
}

export default function App() {
  const [tab, setTab] = useState("inici");
  const [currentMember, setCurrentMember] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginStep, setLoginStep] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pins, setPins] = useState({});
  const [plans, setPlans] = useState([]);
  const [records, setRecords] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [anecdotes, setAnecdotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loaded = 0;
    const check = () => {
      loaded++;
      if (loaded >= 5) setLoading(false);
    };
    const unsub1 = subscribeCollection("pins", (items) => {
      const map = {};
      items.forEach((it) => { map[it.id] = it.pin; });
      setPins(map);
      check();
    });
    const unsub2 = subscribeCollection("plans", (items) => {
      setPlans(items.slice().sort(byCreatedDesc));
      check();
    });
    const unsub3 = subscribeCollection("records", (items) => {
      setRecords(items.length ? items.slice().sort(byCreatedDesc) : SEED_RECORDS);
      check();
    });
    const unsub4 = subscribeCollection("profiles", (items) => {
      const map = {};
      items.forEach((it) => { map[it.id] = it; });
      setProfiles(map);
      check();
    });
    const unsub5 = subscribeCollection("anecdotes", (items) => {
      setAnecdotes(items.slice().sort(byCreatedDesc));
      check();
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); };
  }, []);

  function openLogin(memberId) {
    const hasPin = !!pins[memberId];
    setLoginStep({ memberId, hasPin });
    setPinInput("");
    setPinError("");
    setLoginOpen(true);
  }

  async function confirmPin() {
    const { memberId, hasPin } = loginStep;
    if (pinInput.length < 4) {
      setPinError("El PIN ha de tenir almenys 4 xifres.");
      return;
    }
    if (!hasPin) {
      await setItem("pins", memberId, { pin: pinInput });
      setCurrentMember(memberId);
      setLoginOpen(false);
    } else if (pins[memberId] === pinInput) {
      setCurrentMember(memberId);
      setLoginOpen(false);
    } else {
      setPinError("PIN incorrecte.");
    }
  }

  function logout() {
    setCurrentMember(null);
  }

  // ---- Plans ----
  async function addPlan(plan) {
    const id = uid();
    await setItem("plans", id, {
      ...plan,
      creatorId: currentMember,
      responses: {},
      photos: [],
      comments: [],
      createdAt: Date.now(),
    });
  }

  async function respondPlan(planId, response) {
    await updateItem("plans", planId, { [`responses.${currentMember}`]: response });
  }

  async function deletePlan(planId) {
    await deleteItem("plans", planId);
  }

  async function addPlanPhoto(planId, photoDataUri) {
    await updateItem("plans", planId, {
      photos: arrayUnion({ id: uid(), url: photoDataUri, authorId: currentMember }),
    });
  }

  async function deletePlanPhoto(planId, photoObj) {
    await updateItem("plans", planId, { photos: arrayRemove(photoObj) });
  }

  async function addPlanComment(planId, text) {
    await updateItem("plans", planId, {
      comments: arrayUnion({ id: uid(), text, authorId: currentMember, ts: Date.now() }),
    });
  }

  async function deletePlanComment(planId, commentObj) {
    await updateItem("plans", planId, { comments: arrayRemove(commentObj) });
  }

  // ---- Records ----
  async function addRecord(record) {
    const id = uid();
    await setItem("records", id, { ...record, authorId: currentMember, likes: [], createdAt: Date.now() });
  }

  async function toggleLike(recordId) {
    const record = records.find((r) => r.id === recordId);
    if (!record) return;
    const liked = (record.likes || []).includes(currentMember);
    await updateItem("records", recordId, {
      likes: liked ? arrayRemove(currentMember) : arrayUnion(currentMember),
    });
  }

  async function deleteRecord(recordId) {
    await deleteItem("records", recordId);
  }

  // ---- Perfils ----
  async function updateProfile(memberId, data) {
    await setItem("profiles", memberId, data);
  }

  // ---- Anècdotes ----
  async function addAnecdote(anecdote) {
    const id = uid();
    await setItem("anecdotes", id, { ...anecdote, authorId: currentMember, createdAt: Date.now() });
  }

  async function deleteAnecdote(anecdoteId) {
    await deleteItem("anecdotes", anecdoteId);
  }

  const memberById = (id) => MEMBERS.find((m) => m.id === id);
  const nextPlan = plans[0];

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#f6f1e7", minHeight: "100vh", color: "#2e3a24" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "#2e3a24", color: "#f6f1e7", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ fontWeight: "bold", fontSize: "20px", letterSpacing: "1px" }}>🍇 La Vinya</div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {[["inici", "Inici"], ["colla", "Membres"], ["plans", "Plans"], ["records", "Records"], ["historia", "Història"], ["anecdotes", "Anècdotes"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ background: tab === key ? "#7c5b8e" : "transparent", border: "none", color: "#f6f1e7", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "14px" }}>
              {label}
            </button>
          ))}
        </div>
        <div>
          {currentMember ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: memberById(currentMember).color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>
                {initials(memberById(currentMember).name)}
              </div>
              <span style={{ fontSize: "14px" }}>{memberById(currentMember).name}</span>
              <button onClick={logout} style={{ background: "transparent", border: "1px solid #f6f1e7", color: "#f6f1e7", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", cursor: "pointer" }}>
                Surt
              </button>
            </div>
          ) : (
            <select defaultValue="" onChange={(e) => { if (e.target.value) openLogin(e.target.value); e.target.value = ""; }} style={{ padding: "6px 10px", borderRadius: "8px", border: "none", fontFamily: "inherit" }}>
              <option value="" disabled>Qui ets?</option>
              {MEMBERS.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
          )}
        </div>
      </div>

      {loginOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", width: "280px", textAlign: "center" }}>
            <div style={{ fontWeight: "bold", marginBottom: "10px" }}>{memberById(loginStep.memberId).name}</div>
            <div style={{ fontSize: "13px", marginBottom: "12px", color: "#555" }}>
              {loginStep.hasPin ? "Introdueix el teu PIN" : "Primer cop? Crea un PIN (mín. 4 xifres) per identificar-te la propera vegada."}
            </div>
            <input type="password" inputMode="numeric" value={pinInput} onChange={(e) => setPinInput(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc", textAlign: "center", fontSize: "18px", letterSpacing: "4px", marginBottom: "8px", boxSizing: "border-box" }} maxLength={6} autoFocus />
            {pinError && <div style={{ color: "#a13", fontSize: "12px", marginBottom: "8px" }}>{pinError}</div>}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <button onClick={confirmPin} style={{ background: "#4a5d3a", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>Entra</button>
              <button onClick={() => setLoginOpen(false)} style={{ background: "#eee", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>Cancel·la</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "60px", textAlign: "center" }}>Carregant...</div>
      ) : (
        <>
          {tab === "inici" && <Inici nextPlan={nextPlan} records={records} setTab={setTab} />}
          {tab === "colla" && <Colla profiles={profiles} currentMember={currentMember} updateProfile={updateProfile} />}
          {tab === "plans" && (
            <Plans
              plans={plans}
              currentMember={currentMember}
              memberById={memberById}
              addPlan={addPlan}
              respondPlan={respondPlan}
              deletePlan={deletePlan}
              addPlanPhoto={addPlanPhoto}
              deletePlanPhoto={deletePlanPhoto}
              addPlanComment={addPlanComment}
              deletePlanComment={deletePlanComment}
            />
          )}
          {tab === "records" && <Records records={records} currentMember={currentMember} memberById={memberById} addRecord={addRecord} toggleLike={toggleLike} deleteRecord={deleteRecord} />}
          {tab === "historia" && <Historia />}
          {tab === "anecdotes" && (
            <Anecdotes
              anecdotes={anecdotes}
              currentMember={currentMember}
              memberById={memberById}
              addAnecdote={addAnecdote}
              deleteAnecdote={deleteAnecdote}
            />
          )}
        </>
      )}
    </div>
  );
}

function Inici({ nextPlan, records, setTab }) {
  return (
    <div>
      <div style={{ position: "relative", height: "360px", backgroundImage: `linear-gradient(rgba(20,30,15,0.35), rgba(20,30,15,0.55)), url(/img/finca.jpg)`, backgroundSize: "cover", backgroundPosition: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", textAlign: "center", padding: "20px" }}>
        <h1 style={{ fontSize: "48px", margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>Som La Vinya</h1>
        <p style={{ fontSize: "16px", opacity: 0.9, marginTop: "8px" }}>Beure, fumar i relax</p>
        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <button onClick={() => setTab("plans")} style={{ background: "#7c5b8e", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "10px", cursor: "pointer", fontFamily: "inherit" }}>Crear un pla</button>
          <button onClick={() => setTab("records")} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid #fff", padding: "10px 18px", borderRadius: "10px", cursor: "pointer", fontFamily: "inherit" }}>Penjar una foto</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: "16px", padding: "24px", flexWrap: "wrap", justifyContent: "center" }}>
        <StatCard label={nextPlan ? nextPlan.name : "Cap pla"} sub={nextPlan ? `${nextPlan.date} · ${nextPlan.place || "lloc per decidir"}` : "Encara no hi ha cap pla creat"} />
        <StatCard label={`${records.length} records`} sub="Guardats a l'àlbum" />
      </div>
    </div>
  );
}

function StatCard({ label, sub }) {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", padding: "18px 22px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", minWidth: "180px", textAlign: "center" }}>
      <div style={{ fontWeight: "bold", fontSize: "18px", color: "#4a5d3a" }}>{label}</div>
      <div style={{ fontSize: "12px", color: "#777", marginTop: "4px" }}>{sub}</div>
    </div>
  );
}

function Colla({ profiles, currentMember, updateProfile }) {
  const [editingId, setEditingId] = useState(null);
  const [subtitle, setSubtitle] = useState("");
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  function startEdit(m) {
    const p = profiles[m.id] || {};
    setSubtitle(p.subtitle || "");
    setPhoto(p.photo || null);
    setEditingId(m.id);
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setPhoto(compressed);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    await updateProfile(editingId, { subtitle, photo });
    setSaving(false);
    setEditingId(null);
  }

  return (
    <div style={{ padding: "30px" }}>
      <h2 style={{ color: "#4a5d3a" }}>Membres</h2>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
        13 membres. Cadascú pot editar el seu propi perfil (foto i subtítol) un cop identificat amb el seu PIN.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
        {MEMBERS.map((m) => {
          const p = profiles[m.id] || {};
          const isMe = currentMember === m.id;
          const isEditing = editingId === m.id;
          return (
            <div key={m.id} style={{ background: "#fff", borderRadius: "14px", padding: "18px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              {p.photo ? (
                <img src={p.photo} alt={m.name} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px", display: "block" }} />
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: m.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontWeight: "bold", fontSize: "18px" }}>
                  {initials(m.name)}
                </div>
              )}
              <div style={{ fontWeight: "bold" }}>{m.name}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>
                {p.subtitle || "Membre de La Vinya"}
              </div>
              {isMe && !isEditing && (
                <button onClick={() => startEdit(m)} style={{ marginTop: "10px", background: "#eee", border: "none", padding: "5px 10px", borderRadius: "8px", fontSize: "11px", cursor: "pointer" }}>
                  Edita el meu perfil
                </button>
              )}
              {isEditing && (
                <form onSubmit={save} style={{ marginTop: "10px", display: "grid", gap: "6px", textAlign: "left" }}>
                  <input placeholder="Subtítol (p. ex. el conductor oficial)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} style={{ ...inputStyle, fontSize: "12px", padding: "5px" }} />
                  <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} style={{ fontSize: "11px" }} />
                  {photo && <img src={photo} alt="preview" style={{ width: "100%", borderRadius: "8px" }} />}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button type="submit" disabled={saving} style={{ flex: 1, background: "#4a5d3a", color: "#fff", border: "none", padding: "6px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>
                      {saving ? "Desant..." : "Desa"}
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} style={{ flex: 1, background: "#eee", border: "none", padding: "6px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>Cancel·la</button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Plans({ plans, currentMember, memberById, addPlan, respondPlan, deletePlan, addPlanPhoto, deletePlanPhoto, addPlanComment, deletePlanComment }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [description, setDescription] = useState("");
  const [openPlanId, setOpenPlanId] = useState(null);

  function submit(e) {
    e.preventDefault();
    if (!name || !date) return;
    addPlan({ name, date, time, place, description });
    setName(""); setDate(""); setTime(""); setPlace(""); setDescription("");
    setShowForm(false);
  }

  const openPlan = plans.find((p) => p.id === openPlanId);

  if (openPlan) {
    return (
      <PlanDetail
        plan={openPlan}
        currentMember={currentMember}
        memberById={memberById}
        onBack={() => setOpenPlanId(null)}
        addPlanPhoto={addPlanPhoto}
        deletePlanPhoto={deletePlanPhoto}
        addPlanComment={addPlanComment}
        deletePlanComment={deletePlanComment}
      />
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "#4a5d3a" }}>Plans</h2>
        {currentMember && (
          <button onClick={() => setShowForm(!showForm)} style={{ background: "#7c5b8e", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "10px", cursor: "pointer" }}>
            {showForm ? "Tanca" : "+ Nou pla"}
          </button>
        )}
      </div>
      {!currentMember && <p style={{ color: "#999", fontSize: "13px" }}>Selecciona el teu nom a dalt per crear plans o apuntar-te.</p>}
      {showForm && (
        <form onSubmit={submit} style={{ background: "#fff", padding: "18px", borderRadius: "14px", marginTop: "14px", display: "grid", gap: "10px", maxWidth: "420px" }}>
          <input placeholder="Nom del pla" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <div style={{ display: "flex", gap: "8px" }}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
          </div>
          <input placeholder="Lloc" value={place} onChange={(e) => setPlace(e.target.value)} style={inputStyle} />
          <textarea placeholder="Descripció" value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: "60px" }} />
          <button type="submit" style={{ background: "#4a5d3a", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer" }}>Crear pla</button>
        </form>
      )}
      <div style={{ marginTop: "20px", display: "grid", gap: "14px" }}>
        {plans.length === 0 && <p style={{ color: "#999" }}>Encara no hi ha cap pla.</p>}
        {plans.map((p) => {
          const responses = p.responses || {};
          const confirmed = Object.entries(responses).filter(([, r]) => r === "va");
          const maybe = Object.entries(responses).filter(([, r]) => r === "potser");
          const cant = Object.entries(responses).filter(([, r]) => r === "no_puc");
          const myResponse = currentMember ? responses[currentMember] : null;
          const photoCount = (p.photos || []).length;
          const commentCount = (p.comments || []).length;
          return (
            <div key={p.id} style={{ background: "#fff", borderRadius: "14px", padding: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: "bold", fontSize: "17px" }}>{p.name}</div>
                {currentMember === p.creatorId && (
                  <button onClick={() => deletePlan(p.id)} style={{ background: "transparent", border: "none", color: "#a13", cursor: "pointer", fontSize: "12px" }}>Elimina</button>
                )}
              </div>
              <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                {p.date} {p.time && `· ${p.time}`} {p.place && `· ${p.place}`}
              </div>
              {p.description && <div style={{ fontSize: "14px", marginTop: "8px" }}>{p.description}</div>}
              <div style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>Creat per {memberById(p.creatorId)?.name || "?"}</div>
              <div style={{ fontSize: "13px", marginTop: "10px" }}><strong>Hi van ({confirmed.length}):</strong> {confirmed.map(([id]) => memberById(id)?.name).join(", ") || "—"}</div>
              <div style={{ fontSize: "13px" }}><strong>Potser ({maybe.length}):</strong> {maybe.map(([id]) => memberById(id)?.name).join(", ") || "—"}</div>
              <div style={{ fontSize: "13px" }}><strong>No poden ({cant.length}):</strong> {cant.map(([id]) => memberById(id)?.name).join(", ") || "—"}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "8px" }}>
                {currentMember && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button onClick={() => respondPlan(p.id, "va")} style={{ background: myResponse === "va" ? "#4a5d3a" : "#eee", color: myResponse === "va" ? "#fff" : "#333", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>Hi vaig</button>
                    <button onClick={() => respondPlan(p.id, "potser")} style={{ background: myResponse === "potser" ? "#7c5b8e" : "#eee", color: myResponse === "potser" ? "#fff" : "#333", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>Potser</button>
                    <button onClick={() => respondPlan(p.id, "no_puc")} style={{ background: myResponse === "no_puc" ? "#9a4f4f" : "#eee", color: myResponse === "no_puc" ? "#fff" : "#333", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>No puc</button>
                  </div>
                )}
                <button
                  onClick={() => setOpenPlanId(p.id)}
                  style={{ background: "transparent", border: "none", color: "#7c5b8e", cursor: "pointer", fontSize: "12px", textDecoration: "underline", marginLeft: "auto" }}
                >
                  📷 Fotos i comentaris {photoCount + commentCount > 0 ? `(${photoCount + commentCount})` : ""}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanDetail({ plan, currentMember, memberById, onBack, addPlanPhoto, deletePlanPhoto, addPlanComment, deletePlanComment }) {
  const [commentText, setCommentText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const compressed = await compressImage(file);
    await addPlanPhoto(plan.id, compressed);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function submitComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    addPlanComment(plan.id, commentText.trim());
    setCommentText("");
  }

  const photos = plan.photos || [];
  const comments = [...(plan.comments || [])].sort((a, b) => a.ts - b.ts);

  return (
    <div style={{ padding: "30px", maxWidth: "560px" }}>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#4a5d3a", cursor: "pointer", fontSize: "13px", marginBottom: "12px" }}>
        ← Tornar als plans
      </button>
      <h2 style={{ color: "#4a5d3a", marginBottom: "0" }}>{plan.name}</h2>
      <div style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        {plan.date} {plan.time && `· ${plan.time}`} {plan.place && `· ${plan.place}`}
      </div>

      <h3 style={{ fontSize: "15px", color: "#4a5d3a" }}>Fotos</h3>
      {currentMember && (
        <div style={{ marginBottom: "12px" }}>
          <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} disabled={uploading} />
          {uploading && <span style={{ fontSize: "12px", color: "#999", marginLeft: "8px" }}>Pujant...</span>}
        </div>
      )}
      {photos.length === 0 && <p style={{ color: "#999", fontSize: "13px" }}>Encara no hi ha cap foto.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "8px", marginBottom: "24px" }}>
        {photos.map((ph) => (
          <div key={ph.id} style={{ position: "relative" }}>
            <img src={ph.url} alt="" style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "8px", display: "block" }} />
            {currentMember === ph.authorId && (
              <button
                onClick={() => deletePlanPhoto(plan.id, ph)}
                style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "6px", fontSize: "10px", cursor: "pointer", padding: "2px 5px" }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: "15px", color: "#4a5d3a" }}>Comentaris</h3>
      <div style={{ display: "grid", gap: "8px", marginBottom: "14px" }}>
        {comments.length === 0 && <p style={{ color: "#999", fontSize: "13px" }}>Encara no hi ha cap comentari.</p>}
        {comments.map((c) => (
          <div key={c.id} style={{ background: "#fff", borderRadius: "10px", padding: "10px 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#4a5d3a" }}>{memberById(c.authorId)?.name || "?"}</span>
              {currentMember === c.authorId && (
                <button onClick={() => deletePlanComment(plan.id, c)} style={{ background: "transparent", border: "none", color: "#a13", cursor: "pointer", fontSize: "11px" }}>
                  Elimina
                </button>
              )}
            </div>
            <div style={{ fontSize: "13px", marginTop: "2px" }}>{c.text}</div>
          </div>
        ))}
      </div>
      {currentMember ? (
        <form onSubmit={submitComment} style={{ display: "flex", gap: "8px" }}>
          <input
            placeholder="Escriu un comentari..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            style={{ ...inputStyle }}
          />
          <button type="submit" style={{ background: "#4a5d3a", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer" }}>
            Envia
          </button>
        </form>
      ) : (
        <p style={{ color: "#999", fontSize: "13px" }}>Selecciona el teu nom a dalt per comentar o pujar fotos.</p>
      )}
    </div>
  );
}

function Records({ records, currentMember, memberById, addRecord, toggleLike, deleteRecord }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setPhoto(compressed);
  }

  async function submit(e) {
    e.preventDefault();
    if (!title) return;
    setSaving(true);
    await addRecord({ title, date, place, description, photo });
    setSaving(false);
    setTitle(""); setDate(""); setPlace(""); setDescription(""); setPhoto(null);
    if (fileRef.current) fileRef.current.value = "";
    setShowForm(false);
  }

  return (
    <div style={{ padding: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "#4a5d3a" }}>Records</h2>
        {currentMember && (
          <button onClick={() => setShowForm(!showForm)} style={{ background: "#7c5b8e", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "10px", cursor: "pointer" }}>
            {showForm ? "Tanca" : "+ Nou record"}
          </button>
        )}
      </div>
      {!currentMember && <p style={{ color: "#999", fontSize: "13px" }}>Selecciona el teu nom a dalt per publicar un record.</p>}
      {showForm && (
        <form onSubmit={submit} style={{ background: "#fff", padding: "18px", borderRadius: "14px", marginTop: "14px", display: "grid", gap: "10px", maxWidth: "420px" }}>
          <input placeholder="Títol" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          <input placeholder="Lloc" value={place} onChange={(e) => setPlace(e.target.value)} style={inputStyle} />
          <textarea placeholder="Explica la història..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: "60px" }} />
          <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} />
          {photo && <img src={photo} alt="preview" style={{ maxWidth: "100%", borderRadius: "10px" }} />}
          <button type="submit" disabled={saving} style={{ background: "#4a5d3a", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer" }}>
            {saving ? "Publicant..." : "Publicar record"}
          </button>
        </form>
      )}
      <div style={{ columns: "260px", columnGap: "16px", marginTop: "20px" }}>
        {records.map((r) => {
          const liked = currentMember && (r.likes || []).includes(currentMember);
          return (
            <div key={r.id} style={{ background: "#fff", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "16px", breakInside: "avoid" }}>
              {r.photo && <img src={r.photo} alt={r.title} style={{ width: "100%", display: "block" }} />}
              <div style={{ padding: "14px" }}>
                <div style={{ fontWeight: "bold" }}>{r.title}</div>
                <div style={{ fontSize: "12px", color: "#999" }}>{[r.place, r.date].filter(Boolean).join(" · ")}</div>
                {r.description && <div style={{ fontSize: "13px", marginTop: "6px" }}>{r.description}</div>}
                <div style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>Publicat per {memberById(r.authorId)?.name || "?"}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                  <button disabled={!currentMember} onClick={() => toggleLike(r.id)} style={{ background: "transparent", border: "none", cursor: currentMember ? "pointer" : "default", fontSize: "14px", color: liked ? "#a13" : "#999" }}>
                    {liked ? "♥" : "♡"} {(r.likes || []).length}
                  </button>
                  {currentMember === r.authorId && (
                    <button onClick={() => deleteRecord(r.id)} style={{ background: "transparent", border: "none", color: "#a13", cursor: "pointer", fontSize: "12px" }}>Elimina</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Historia() {
  return (
    <div style={{ padding: "30px", maxWidth: "640px" }}>
      <h2 style={{ color: "#4a5d3a" }}>Història</h2>
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          padding: "24px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          lineHeight: "1.7",
          fontSize: "15px",
        }}
      >
        <p>
          La finca data de l'any 1926. Va ser durant generacions propietat de la família
          Marchena, fins que, gràcies al nostre amic <strong>Eduard</strong>, va arribar a
          les nostres mans.
        </p>
        <p>
          L'any 2022 vam engegar un procés per tornar-li la dignitat que es mereixia,
          després d'anys d'abandonament. Des de llavors s'ha convertit en el bressol de
          l'<strong>Associació Cultural Amics de la Vinya (A.C.A.V.)</strong>, i testimoni
          de grans nits i encara més grans ressaques.
        </p>
        <p>
          Productora d'herbes verdes i d'algun intent (encara per confirmar) de moscatell,
          la finca compta ja amb la seva pròpia sala sagrada de família: <strong>la
          cuina</strong>.
        </p>
      </div>
    </div>
  );
}

function Anecdotes({ anecdotes, currentMember, memberById, addAnecdote, deleteAnecdote }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setPhoto(compressed);
  }

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    await addAnecdote({ title: title.trim(), body: body.trim(), photo });
    setSaving(false);
    setTitle("");
    setBody("");
    setPhoto(null);
    if (fileRef.current) fileRef.current.value = "";
    setShowForm(false);
  }

  return (
    <div style={{ padding: "30px", maxWidth: "640px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "#4a5d3a" }}>Anècdotes</h2>
        {currentMember && (
          <button onClick={() => setShowForm(!showForm)} style={{ background: "#7c5b8e", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "10px", cursor: "pointer" }}>
            {showForm ? "Tanca" : "+ Nova anècdota"}
          </button>
        )}
      </div>
      {!currentMember && <p style={{ color: "#999", fontSize: "13px" }}>Selecciona el teu nom a dalt per explicar una anècdota.</p>}
      {showForm && (
        <form onSubmit={submit} style={{ background: "#fff", padding: "18px", borderRadius: "14px", marginTop: "14px", display: "grid", gap: "10px" }}>
          <input placeholder="Títol de l'anècdota" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          <textarea placeholder="Explica'ns què va passar..." value={body} onChange={(e) => setBody(e.target.value)} style={{ ...inputStyle, minHeight: "100px" }} />
          <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} />
          {photo && <img src={photo} alt="preview" style={{ maxWidth: "100%", borderRadius: "10px" }} />}
          <button type="submit" disabled={saving} style={{ background: "#4a5d3a", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer" }}>
            {saving ? "Publicant..." : "Publicar anècdota"}
          </button>
        </form>
      )}
      <div style={{ marginTop: "20px", display: "grid", gap: "16px" }}>
        {anecdotes.length === 0 && <p style={{ color: "#999" }}>Encara no hi ha cap anècdota.</p>}
        {anecdotes.map((a) => (
          <div key={a.id} style={{ background: "#fff", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {a.photo && <img src={a.photo} alt={a.title} style={{ width: "100%", maxHeight: "320px", objectFit: "cover", display: "block" }} />}
            <div style={{ padding: "16px" }}>
              <div style={{ fontWeight: "bold", fontSize: "16px" }}>{a.title}</div>
              <div style={{ fontSize: "14px", marginTop: "8px", whiteSpace: "pre-wrap" }}>{a.body}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                <div style={{ fontSize: "12px", color: "#999" }}>Explicada per {memberById(a.authorId)?.name || "?"}</div>
                {currentMember === a.authorId && (
                  <button onClick={() => deleteAnecdote(a.id)} style={{ background: "transparent", border: "none", color: "#a13", cursor: "pointer", fontSize: "12px" }}>
                    Elimina
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
