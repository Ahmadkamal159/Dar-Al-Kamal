import tkinter as tk
from tkinter import ttk, messagebox, filedialog, simpledialog
import pyodbc
import pandas as pd
import numpy as np
from scipy.integrate import solve_ivp
import matplotlib.pyplot as plt
import os
import re
import json
from datetime import datetime
from pathlib import Path

SERVER = 'AhmadKamal'
DATABASE = 'Dar_AlKamal_DB'
CONNECTION_STRING = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={SERVER};DATABASE={DATABASE};Trusted_Connection=yes;'

K_FIXED = None
T90_TARGET_HOURS = 24.0

# ---------- إعدادات المشاريع والحفظ التلقائي ----------
BASE_DIR = Path.home() / "Dar_AlKamal_Projects"     # كل مشروع ليه فولدر جواه
DEFAULT_PROJECT = "Untitled"
DEFAULT_AUTOSAVE_MIN = 5
MAX_AUTOSAVES = 20                                   # عدد نسخ الحفظ التلقائي المحتفظ بيها لكل مشروع
LAST_PROJECT_FILE = BASE_DIR / ".last_project"


def safe_name(name):
    return re.sub(r'[\\/:*?"<>|]', '_', name).strip().strip('.')


def get_materials_from_db():
    try:
        conn = pyodbc.connect(CONNECTION_STRING)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT Name, CAS_Number, MolecularWeight, VaporPressure, Category, ODT, ODT_Unit, ODT_Source, Confidence FROM FragranceMaterials")
        rows = cursor.fetchall()

        data = []
        for row in rows:
            data.append({
                "Name": row[0],
                "CAS_Number": row[1],
                "MolecularWeight": row[2],
                "VaporPressure": row[3],
                "Category": row[4],
                "ODT": row[5] if row[5] is not None else np.nan,
                "ODT_Unit": row[6] if row[6] is not None else "",
                "ODT_Source": row[7] if row[7] is not None else "",
                "Confidence": row[8] if row[8] is not None else "Unknown"
            })
        conn.close()
        return pd.DataFrame(data).sort_values("Name")
    except Exception as e:
        messagebox.showerror("خطأ اتصال", f"فشل الاتصال بقاعدة البيانات:\n{e}")
        return pd.DataFrame()


class SearchableCombobox(tk.Frame):
    """Entry + قائمة منبثقة بتتفلتر أثناء الكتابة، والـ focus يفضل في الـ Entry."""

    def __init__(self, master, all_values, font=("Arial", 10), width=38, **kwargs):
        super().__init__(master, bg=master.cget("bg"))
        self.all_values = list(all_values)
        self._font = font
        self._popup = None
        self._listbox = None
        self._select_callback = None

        self.var = tk.StringVar()
        self.entry = tk.Entry(self, textvariable=self.var, font=font, width=width)
        self.entry.pack(side=tk.LEFT, fill=tk.X, expand=True)

        self.arrow = tk.Button(self, text="▼", font=("Arial", 8), width=2,
                               command=self.toggle_popup, takefocus=0)
        self.arrow.pack(side=tk.LEFT)

        self.entry.bind("<KeyRelease>", self._on_key_release)
        self.entry.bind("<Down>", self._on_down)
        self.entry.bind("<Up>", self._on_up)
        self.entry.bind("<Return>", self._on_return)
        self.entry.bind("<Escape>", lambda e: self.hide_popup())
        self.entry.bind("<FocusOut>", self._on_focus_out)

    # ---------- واجهة شبيهة بالـ Combobox ----------
    def get(self):
        return self.var.get()

    def set(self, value):
        self.var.set(value)

    def bind(self, sequence=None, func=None, add=None):
        if sequence == "<<ComboboxSelected>>":
            self._select_callback = func
            return
        return super().bind(sequence, func, add)

    # ---------- القائمة المنبثقة ----------
    def _filtered(self):
        text = self.var.get().strip().lower()
        if not text:
            return self.all_values

        scored = []
        for v in self.all_values:
            pos = v.lower().find(text)
            if pos != -1:
                scored.append((pos, v.lower(), v))

        scored.sort(key=lambda t: (t[0], t[1]))
        return [t[2] for t in scored]

    def show_popup(self):
        items = self._filtered()
        if not items:
            self.hide_popup()
            return

        if self._popup is None:
            self._popup = tk.Toplevel(self)
            self._popup.wm_overrideredirect(True)
            self._popup.attributes("-topmost", True)

            frame = tk.Frame(self._popup, bd=1, relief="solid")
            frame.pack(fill=tk.BOTH, expand=True)

            sb = ttk.Scrollbar(frame, orient="vertical")
            self._listbox = tk.Listbox(frame, font=self._font, activestyle="none",
                                       exportselection=False, yscrollcommand=sb.set)
            sb.config(command=self._listbox.yview)
            sb.pack(side=tk.RIGHT, fill=tk.Y)
            self._listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

            self._listbox.bind("<ButtonRelease-1>", self._on_click)
            self._listbox.bind("<MouseWheel>",
                               lambda e: self._listbox.yview_scroll(int(-e.delta / 120), "units"))

        self._listbox.delete(0, tk.END)
        for item in items:
            self._listbox.insert(tk.END, item)
        self._listbox.config(height=min(len(items), 8))

        self.update_idletasks()
        x = self.entry.winfo_rootx()
        y = self.entry.winfo_rooty() + self.entry.winfo_height()
        w = self.entry.winfo_width() + self.arrow.winfo_width()
        self._popup.geometry(f"{w}x{self._listbox.winfo_reqheight() + 4}+{x}+{y}")
        self._popup.deiconify()

    def hide_popup(self):
        if self._popup is not None:
            self._popup.destroy()
            self._popup = None
            self._listbox = None

    def toggle_popup(self):
        if self._popup is not None:
            self.hide_popup()
        else:
            self.entry.focus_set()
            self.show_popup()

    # ---------- الأحداث ----------
    def _on_key_release(self, event):
        if event.keysym in ("Up", "Down", "Return", "Tab", "Escape",
                            "Shift_L", "Shift_R", "Control_L", "Control_R",
                            "Left", "Right"):
            return
        self.show_popup()

    def _on_down(self, event):
        if self._popup is None:
            self.show_popup()
        if self._listbox is not None and self._listbox.size() > 0:
            cur = self._listbox.curselection()
            nxt = 0 if not cur else min(cur[0] + 1, self._listbox.size() - 1)
            self._set_listbox_selection(nxt)
        return "break"

    def _on_up(self, event):
        if self._listbox is not None and self._listbox.size() > 0:
            cur = self._listbox.curselection()
            nxt = 0 if not cur else max(cur[0] - 1, 0)
            self._set_listbox_selection(nxt)
        return "break"

    def _set_listbox_selection(self, index):
        self._listbox.selection_clear(0, tk.END)
        self._listbox.selection_set(index)
        self._listbox.activate(index)
        self._listbox.see(index)

    def _on_return(self, event):
        if self._listbox is not None:
            cur = self._listbox.curselection()
            if cur:
                self._choose(self._listbox.get(cur[0]))
            elif self._listbox.size() == 1:
                self._choose(self._listbox.get(0))
            else:
                self.hide_popup()
        return "break"

    def _on_click(self, event):
        idx = self._listbox.nearest(event.y)
        if idx >= 0:
            self._choose(self._listbox.get(idx))

    def _choose(self, value):
        self.var.set(value)
        self.entry.icursor(tk.END)
        self.hide_popup()
        if self._select_callback:
            self._select_callback(None)

    def _on_focus_out(self, event):
        self.after(150, self._close_if_unfocused)

    def _close_if_unfocused(self):
        try:
            focus = self.focus_get()
        except KeyError:
            focus = None
        if self._popup is not None and (focus is None or focus is not self._listbox):
            self.hide_popup()


class ExitDialog(tk.Toplevel):
    """نافذة تأكيد الخروج: حفظ وخروج / خروج بدون حفظ / إلغاء"""

    def __init__(self, master, project_name):
        super().__init__(master)
        self.result = "cancel"
        self.title("إغلاق البرنامج")
        self.resizable(False, False)
        self.config(bg="#f4f6f9")
        self.transient(master)

        tk.Label(self, text="هل تريد إغلاق البرنامج؟", font=("Arial", 12, "bold"),
                 bg="#f4f6f9", fg="#1e293b").pack(padx=30, pady=(20, 5))
        tk.Label(self, text=f"المشروع الحالي: {project_name}", font=("Arial", 10),
                 bg="#f4f6f9", fg="#475569").pack(padx=30, pady=(0, 15))

        btns = tk.Frame(self, bg="#f4f6f9")
        btns.pack(padx=20, pady=(0, 20))

        def make_btn(text, value, bg):
            tk.Button(btns, text=text, font=("Arial", 10, "bold"), bg=bg, fg="white",
                      padx=12, pady=6, command=lambda: self._set(value)).pack(side=tk.LEFT, padx=6)

        make_btn("حفظ وخروج", "save", "#16a34a")
        make_btn("خروج بدون حفظ", "exit", "#dc2626")
        make_btn("إلغاء (ارجع للبرنامج)", "cancel", "#475569")

        self.protocol("WM_DELETE_WINDOW", lambda: self._set("cancel"))
        self.bind("<Escape>", lambda e: self._set("cancel"))

        self.update_idletasks()
        x = master.winfo_rootx() + (master.winfo_width() - self.winfo_width()) // 2
        y = master.winfo_rooty() + (master.winfo_height() - self.winfo_height()) // 3
        self.geometry(f"+{max(x, 0)}+{max(y, 0)}")
        self.grab_set()
        self.focus_set()

    def _set(self, value):
        self.result = value
        self.destroy()


class OdorValueEngineApp:
    def __init__(self, root):
        self.root = root
        self.root.title("دار الكمال | محرك منحنيات الإحساس الشمي الحركي (Kinetic OV Model)")
        self.root.geometry("1000x700")
        self.root.config(bg="#f4f6f9")

        self.materials_df = get_materials_from_db()
        if self.materials_df.empty:
            messagebox.showwarning("تنبيه", "قاعدة البيانات فارغة أو تعذر الاتصال!")
        self.material_names = self.materials_df['Name'].tolist() if not self.materials_df.empty else []

        # حالة المشروع
        self.project_name = DEFAULT_PROJECT
        self.autosave_enabled = tk.BooleanVar(value=True)
        self.autosave_minutes = DEFAULT_AUTOSAVE_MIN
        self.autosave_job = None
        self.saved_snapshot = None
        self.last_autosave_snapshot = None
        self.status_var = tk.StringVar(value="")

        self.rows = []  # مصفوفة لتخزين الصفوف النشطة
        self.create_widgets()
        self.create_menu()

        self.root.bind("<Configure>", self.on_root_configure)
        self.root.bind("<Control-s>", lambda e: self.save_project())
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

        self.startup_load()
        self.schedule_autosave()

    # =====================================================================
    #                              الواجهة
    # =====================================================================
    def on_root_configure(self, event):
        if event.widget is self.root:
            for r in self.rows:
                r[0].hide_popup()

    def create_menu(self):
        menubar = tk.Menu(self.root)

        file_menu = tk.Menu(menubar, tearoff=0)
        file_menu.add_command(label="مشروع جديد...", command=self.new_project)
        file_menu.add_command(label="فتح مشروع...", command=self.open_project)
        file_menu.add_separator()
        file_menu.add_command(label="حفظ  (Ctrl+S)", command=self.save_project)
        file_menu.add_command(label="حفظ باسم...", command=self.save_project_as)
        file_menu.add_separator()
        file_menu.add_command(label="فتح فولدر المشروع", command=self.open_project_folder)
        file_menu.add_separator()
        file_menu.add_command(label="خروج", command=self.on_close)
        menubar.add_cascade(label="ملف", menu=file_menu)

        auto_menu = tk.Menu(menubar, tearoff=0)
        auto_menu.add_checkbutton(label="تفعيل الحفظ التلقائي", variable=self.autosave_enabled,
                                  command=self.schedule_autosave)
        auto_menu.add_command(label="تغيير المدة...", command=self.change_autosave_interval)
        menubar.add_cascade(label="الحفظ التلقائي", menu=auto_menu)

        self.root.config(menu=menubar)

    def create_widgets(self):
        title_label = tk.Label(self.root, text="دار الكمال | النموذج الحركي للإحساس الشمي (Kinetic OV Model)",
                               font=("Arial", 14, "bold"), bg="#f4f6f9", fg="#1e293b")
        title_label.pack(pady=10)

        container_frame = tk.Frame(self.root, bg="#f4f6f9")
        container_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=5)

        header_frame = tk.Frame(container_frame, bg="#cbd5e1")
        header_frame.pack(fill=tk.X, pady=2)
        tk.Label(header_frame, text="اختر الخامة العطرية", font=("Arial", 10, "bold"), width=40, anchor="w",
                 bg="#cbd5e1").pack(side=tk.LEFT, padx=5)
        tk.Label(header_frame, text="رقم الـ CAS", font=("Arial", 10, "bold"), width=20, anchor="w", bg="#cbd5e1").pack(
            side=tk.LEFT, padx=5)
        tk.Label(header_frame, text="النسبة (Parts)", font=("Arial", 10, "bold"), width=15, anchor="w",
                 bg="#cbd5e1").pack(side=tk.LEFT, padx=5)

        canvas_container = tk.Frame(container_frame, bg="#f4f6f9")
        canvas_container.pack(fill=tk.BOTH, expand=True, pady=5)

        self.canvas = tk.Canvas(canvas_container, bg="#f4f6f9", highlightthickness=0)
        self.scrollbar = ttk.Scrollbar(canvas_container, orient="vertical", command=self.canvas.yview)

        self.inputs_frame = tk.Frame(self.canvas, bg="#f4f6f9")
        self.inputs_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )

        self.canvas.create_window((0, 0), window=self.inputs_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=self.scrollbar.set)

        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.dynamic_btn_frame = tk.Frame(self.inputs_frame, bg="#f4f6f9")
        self.dynamic_btn_frame.pack(fill=tk.X, pady=10)

        self.add_btn = tk.Button(self.dynamic_btn_frame, text="+ إضافة مادة جديدة (Add Material)",
                                 font=("Arial", 10, "bold"), bg="#0284c7", fg="white", padx=12, pady=6,
                                 command=self.add_row)
        self.add_btn.pack(anchor="w", padx=5)

        bottom_btn_frame = tk.Frame(self.root, bg="#f4f6f9")
        bottom_btn_frame.pack(pady=10)

        calc_btn = tk.Button(bottom_btn_frame, text="تشغيل المحاكاة وحساب منحنيات الـ OV", font=("Arial", 11, "bold"),
                             bg="#0f172a", fg="white", padx=15, pady=6, command=self.run_simulation_and_charts)
        calc_btn.pack(side=tk.LEFT, padx=10)

        tk.Label(self.root, textvariable=self.status_var, font=("Arial", 9), bg="#f4f6f9",
                 fg="#475569", anchor="w").pack(fill=tk.X, padx=20, pady=(0, 6))

    def update_title(self):
        self.root.title(f"دار الكمال | {self.project_name} | Kinetic OV Model")

    def set_status(self, text):
        self.status_var.set(text)

    # =====================================================================
    #                         صفوف الخامات
    # =====================================================================
    def add_row(self, material_names=None):
        names = material_names if material_names is not None else self.material_names

        row_frame = tk.Frame(self.inputs_frame, bg="#f4f6f9")
        row_frame.pack(fill=tk.X, pady=4)

        combo_material = SearchableCombobox(
            row_frame,
            all_values=names,
            font=("Arial", 10),
            width=38
        )
        combo_material.pack(side=tk.LEFT, padx=5)

        entry_cas = tk.Entry(row_frame, font=("Arial", 10), width=22)
        entry_cas.pack(side=tk.LEFT, padx=5)

        entry_parts = tk.Entry(row_frame, font=("Arial", 10), width=15)
        entry_parts.pack(side=tk.LEFT, padx=5)

        combo_material.bind("<<ComboboxSelected>>",
                            lambda event, c=combo_material, e=entry_cas: self.on_material_selected(c, e))

        delete_btn = tk.Button(row_frame, text="Delete", bg="#007FFF", fg="white", font=("Arial", 9, "bold"),
                               command=lambda: self.remove_row(row_frame, combo_material, entry_cas, entry_parts))
        delete_btn.pack(side=tk.LEFT, padx=5)

        row_tuple = (combo_material, entry_cas, entry_parts)
        self.rows.append(row_tuple)
        return row_tuple

    def remove_row(self, row_frame, combo, cas, parts):
        combo.hide_popup()
        row_tuple = (combo, cas, parts)
        if row_tuple in self.rows:
            self.rows.remove(row_tuple)
        row_frame.destroy()

    def clear_rows(self):
        for combo, cas, parts in list(self.rows):
            combo.hide_popup()
            combo.master.destroy()  # الـ master هو row_frame
        self.rows.clear()

    def on_material_selected(self, combo, cas_entry):
        selected_name = combo.get()
        match = self.materials_df[self.materials_df['Name'] == selected_name]
        if not match.empty:
            cas_val = match['CAS_Number'].values[0]
            cas_entry.delete(0, tk.END)
            if pd.notna(cas_val):
                cas_entry.insert(0, str(cas_val))

    # =====================================================================
    #                       المشاريع والحفظ
    # =====================================================================
    def project_dir(self, name=None):
        return BASE_DIR / safe_name(name or self.project_name)

    def project_file(self, name=None):
        return self.project_dir(name) / "project.json"

    def autosave_dir(self, name=None):
        return self.project_dir(name) / "autosave"

    def collect_rows(self):
        data = []
        for combo, cas, parts in self.rows:
            item = {"material": combo.get().strip(), "cas": cas.get().strip(), "parts": parts.get().strip()}
            if item["material"] or item["parts"]:
                data.append(item)
        return data

    def snapshot(self):
        return json.dumps(self.collect_rows(), ensure_ascii=False, sort_keys=True)

    def get_state(self):
        return {
            "version": 1,
            "project_name": self.project_name,
            "saved_at": datetime.now().isoformat(timespec="seconds"),
            "autosave_enabled": bool(self.autosave_enabled.get()),
            "autosave_minutes": self.autosave_minutes,
            "rows": self.collect_rows(),
        }

    @staticmethod
    def write_json_atomic(path, data):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        tmp = str(path) + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, path)

    def remember_last_project(self):
        try:
            os.makedirs(BASE_DIR, exist_ok=True)
            LAST_PROJECT_FILE.write_text(safe_name(self.project_name), encoding="utf-8")
        except Exception:
            pass

    def save_project(self):
        try:
            self.write_json_atomic(self.project_file(), self.get_state())
        except Exception as e:
            messagebox.showerror("خطأ في الحفظ", f"تعذر حفظ المشروع:\n{e}")
            return False
        self.saved_snapshot = self.snapshot()
        self.remember_last_project()
        self.set_status(f"تم الحفظ: {datetime.now():%H:%M:%S}  —  {self.project_dir()}")
        return True

    def save_project_as(self):
        name = simpledialog.askstring("حفظ باسم", "اسم المشروع:", initialvalue=self.project_name, parent=self.root)
        if not name:
            return False
        name = safe_name(name)
        if not name:
            messagebox.showerror("خطأ", "اسم المشروع غير صالح.")
            return False
        if name != safe_name(self.project_name) and self.project_file(name).exists():
            if not messagebox.askyesno("مشروع موجود", f"المشروع '{name}' موجود بالفعل. تستبدله؟"):
                return False
        self.project_name = name
        self.update_title()
        ok = self.save_project()
        self.last_autosave_snapshot = None
        return ok

    def confirm_discard(self):
        """يرجّع True لو مسموح نكمل (حفظنا أو المستخدم اختار عدم الحفظ)."""
        if self.snapshot() == self.saved_snapshot:
            return True
        ans = messagebox.askyesnocancel("حفظ المشروع الحالي؟",
                                        f"فيه تغييرات غير محفوظة في '{self.project_name}'.\nتحفظها الأول؟")
        if ans is None:
            return False
        if ans:
            return self.save_project()
        return True

    def reset_rows(self, minimum=4):
        self.clear_rows()
        for _ in range(minimum):
            self.add_row()

    def new_project(self):
        if not self.confirm_discard():
            return
        name = simpledialog.askstring("مشروع جديد", "اسم المشروع:", parent=self.root)
        if not name:
            return
        name = safe_name(name)
        if not name:
            messagebox.showerror("خطأ", "اسم المشروع غير صالح.")
            return
        if self.project_file(name).exists():
            messagebox.showerror("خطأ", f"المشروع '{name}' موجود بالفعل، استخدم فتح مشروع.")
            return
        self.project_name = name
        self.update_title()
        self.reset_rows()
        self.saved_snapshot = None
        self.last_autosave_snapshot = None
        self.save_project()
        self.schedule_autosave()

    def open_project(self):
        if not self.confirm_discard():
            return
        os.makedirs(BASE_DIR, exist_ok=True)
        folder = filedialog.askdirectory(initialdir=str(BASE_DIR), title="اختر فولدر المشروع")
        if not folder:
            return
        if not self.load_from_folder(Path(folder)):
            messagebox.showerror("خطأ", "الفولدر ده مفيهوش مشروع (project.json).")
            return
        self.schedule_autosave()

    def open_project_folder(self):
        os.makedirs(self.project_dir(), exist_ok=True)
        try:
            os.startfile(str(self.project_dir()))
        except Exception as e:
            messagebox.showerror("خطأ", f"تعذر فتح الفولدر:\n{e}")

    def latest_autosave(self, folder):
        adir = folder / "autosave"
        if not adir.exists():
            return None
        files = sorted(adir.glob("autosave_*.json"))
        return files[-1] if files else None

    def load_from_folder(self, folder):
        """يحمّل مشروع من فولدر. لو فيه حفظ تلقائي أحدث من الحفظ اليدوي يسأل عن الاسترجاع."""
        pfile = folder / "project.json"
        auto = self.latest_autosave(folder)

        base_data = None
        if pfile.exists():
            try:
                base_data = json.loads(pfile.read_text(encoding="utf-8"))
            except Exception as e:
                messagebox.showerror("خطأ", f"ملف المشروع تالف:\n{e}")

        chosen = base_data
        if auto is not None and (base_data is None or auto.stat().st_mtime > pfile.stat().st_mtime):
            when = datetime.fromtimestamp(auto.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
            if messagebox.askyesno("استرجاع الحفظ التلقائي",
                                   f"فيه نسخة حفظ تلقائي أحدث من آخر حفظ يدوي ({when}).\nتسترجعها؟"):
                try:
                    chosen = json.loads(auto.read_text(encoding="utf-8"))
                except Exception as e:
                    messagebox.showerror("خطأ", f"ملف الحفظ التلقائي تالف:\n{e}")

        if chosen is None:
            return False

        self.project_name = folder.name
        self.autosave_enabled.set(bool(chosen.get("autosave_enabled", True)))
        self.autosave_minutes = int(chosen.get("autosave_minutes", DEFAULT_AUTOSAVE_MIN))

        self.clear_rows()
        for r in chosen.get("rows", []):
            combo, cas, parts = self.add_row()
            combo.set(r.get("material", ""))
            cas.insert(0, r.get("cas", ""))
            parts.insert(0, r.get("parts", ""))
        for _ in range(max(0, 4 - len(self.rows))):
            self.add_row()

        # لو اتحمّل من حفظ تلقائي، نعتبر آخر حفظ يدوي هو ملف المشروع (فيظهر إن فيه تغييرات غير محفوظة)
        if base_data is not None and chosen is not base_data:
            saved_rows = [r for r in base_data.get("rows", [])]
            self.saved_snapshot = json.dumps(saved_rows, ensure_ascii=False, sort_keys=True)
        else:
            self.saved_snapshot = self.snapshot()
        self.last_autosave_snapshot = self.snapshot()

        self.update_title()
        self.remember_last_project()
        self.set_status(f"تم فتح المشروع: {self.project_name}")
        return True

    def startup_load(self):
        folder = BASE_DIR / DEFAULT_PROJECT
        try:
            if LAST_PROJECT_FILE.exists():
                folder = BASE_DIR / LAST_PROJECT_FILE.read_text(encoding="utf-8").strip()
        except Exception:
            pass

        loaded = False
        if folder.exists():
            loaded = self.load_from_folder(folder)
        if not loaded:
            self.project_name = DEFAULT_PROJECT
            self.update_title()
            self.reset_rows()
            self.saved_snapshot = self.snapshot()
            self.set_status(f"مشروع جديد: {self.project_name}")

    # =====================================================================
    #                          الحفظ التلقائي
    # =====================================================================
    def schedule_autosave(self):
        if self.autosave_job is not None:
            try:
                self.root.after_cancel(self.autosave_job)
            except Exception:
                pass
            self.autosave_job = None
        if self.autosave_enabled.get():
            self.autosave_job = self.root.after(max(1, self.autosave_minutes) * 60 * 1000, self.autosave_tick)

    def change_autosave_interval(self):
        minutes = simpledialog.askinteger("الحفظ التلقائي", "احفظ تلقائياً كل كام دقيقة؟",
                                          initialvalue=self.autosave_minutes, minvalue=1, maxvalue=240,
                                          parent=self.root)
        if minutes:
            self.autosave_minutes = minutes
            self.schedule_autosave()
            self.set_status(f"الحفظ التلقائي كل {minutes} دقيقة")

    def autosave_tick(self):
        try:
            snap = self.snapshot()
            if self.collect_rows() and snap != self.last_autosave_snapshot:
                adir = self.autosave_dir()
                fname = adir / f"autosave_{datetime.now():%Y%m%d_%H%M%S}.json"
                self.write_json_atomic(fname, self.get_state())
                self.last_autosave_snapshot = snap
                # الاحتفاظ بآخر MAX_AUTOSAVES نسخة بس
                files = sorted(adir.glob("autosave_*.json"))
                for old in files[:-MAX_AUTOSAVES]:
                    try:
                        old.unlink()
                    except Exception:
                        pass
                self.set_status(f"حفظ تلقائي: {datetime.now():%H:%M:%S}")
        except Exception as e:
            self.set_status(f"فشل الحفظ التلقائي: {e}")
        finally:
            self.schedule_autosave()

    # =====================================================================
    #                              الإغلاق
    # =====================================================================
    def on_close(self):
        for r in self.rows:
            r[0].hide_popup()

        dlg = ExitDialog(self.root, self.project_name)
        self.root.wait_window(dlg)

        if dlg.result == "cancel":
            return
        if dlg.result == "save" and not self.save_project():
            return  # فشل الحفظ: نفضل في البرنامج

        if self.autosave_job is not None:
            try:
                self.root.after_cancel(self.autosave_job)
            except Exception:
                pass
        plt.close('all')
        self.root.destroy()

    # =====================================================================
    #                           المحاكاة
    # =====================================================================
    def run_simulation_and_charts(self):
        formulation_data = []

        for combo, cas_entry, entry in self.rows:
            mat_name = combo.get().strip()
            cas_val = cas_entry.get().strip()
            parts_val = entry.get().strip()

            if mat_name and parts_val:
                try:
                    parts = float(parts_val)
                    mat_row = self.materials_df[self.materials_df['Name'] == mat_name]
                    if not mat_row.empty:
                        mw = float(mat_row['MolecularWeight'].values[0])
                        p0 = float(mat_row['VaporPressure'].values[0])
                        odt_val = mat_row['ODT'].values[0]
                        odt_unit = mat_row['ODT_Unit'].values[0]
                        odt_source = mat_row['ODT_Source'].values[0]
                        confidence = mat_row['Confidence'].values[0]

                        formulation_data.append({
                            "Material": mat_name, "CAS": cas_val, "Parts": parts,
                            "MW": mw, "P0": p0, "ODT": odt_val,
                            "ODT_Unit": odt_unit, "ODT_Source": odt_source,
                            "Confidence": confidence
                        })
                except (ValueError, TypeError):
                    continue

        if not formulation_data:
            messagebox.showerror("خطأ", "برجاء إدخال مواد ونسَب صحيحة لمعالجة المحاكاة!")
            return

        df = pd.DataFrame(formulation_data)

        estimated_materials = df.loc[df['Confidence'] == 'Estimated', 'Material'].tolist()
        if estimated_materials:
            messagebox.showwarning(
                "مواد تقديرية",
                "الأرقام المطلقة لهذه المواد غير موثوقة لأنها زيوت طبيعية أو مخاليط معقدة:\n\n" + "\n".join(
                    estimated_materials)
            )

        missing = df.loc[~(df['ODT'] > 0), 'Material'].tolist()
        if missing:
            messagebox.showerror("بيانات ناقصة",
                                 "قيمة الـ ODT مفقودة أو صفرية للمواد التالية:\n\n" + "\n".join(missing))
            return

        bad_unit = df.loc[df['ODT_Unit'].astype(str).str.strip().str.lower() != 'ng/l', 'Material'].tolist()
        if bad_unit:
            messagebox.showerror("خطأ في وحدة ODT",
                                 "وحدة الـ ODT يجب أن تكون 'ng/L' للمواد التالية:\n\n" + "\n".join(bad_unit))
            return

        os.makedirs(self.project_dir(), exist_ok=True)
        output_filename = filedialog.asksaveasfilename(
            defaultextension=".xlsx",
            filetypes=[("Excel files", "*.xlsx"), ("All files", "*.*")],
            initialdir=str(self.project_dir()),
            title="حفظ تقرير منحنيات الإحساس الشمي لدار الكمال"
        )

        if not output_filename:
            return

        df['Moles'] = df['Parts'] / df['MW']
        total_moles_initial = df['Moles'].sum()
        df['Mole_Fraction'] = df['Moles'] / total_moles_initial

        df['Partial_Pressure'] = df['Mole_Fraction'] * df['P0']
        total_initial_vapor_pressure = df['Partial_Pressure'].sum()
        df['Vapor_Contribution_Pct'] = (df['Partial_Pressure'] / total_initial_vapor_pressure) * 100

        time_hours = np.linspace(0, 24, 100)

        parts_arr = df['Parts'].to_numpy(dtype=float)
        normalized_parts = parts_arr / parts_arr.sum()
        mw = df['MW'].to_numpy(dtype=float)
        p = df['P0'].to_numpy(dtype=float) * 0.133322
        odt = df['ODT'].to_numpy(dtype=float)

        n0 = normalized_parts / mw
        initial_mass = (n0 * mw).sum()

        def rhs(t, n, current_k):
            n = np.maximum(n, 0)
            s = n.sum()
            x = n / s if s > 1e-30 else np.zeros_like(n)
            return -current_k * x * p / np.sqrt(mw)

        def mass_event(t, n, current_k):
            return (np.maximum(n, 0) * mw).sum() - 0.10 * initial_mass

        mass_event.terminal = True

        if K_FIXED is None:
            s1 = solve_ivp(rhs, (0, 1e6), n0, args=(1.0,), events=mass_event, method='LSODA', rtol=1e-8, atol=1e-14)
            if len(s1.t_events[0]) == 0:
                messagebox.showerror("خطأ في المعايرة", "الكتلة لا تصل لـ10%: راجع قيم الضغط البخاري للمواد.")
                return
            k = s1.t_events[0][0] / T90_TARGET_HOURS
            sim_mode = "معايرة مؤقتة"
        else:
            k = K_FIXED
            sim_mode = "معامل ثابت (K_FIXED)"

        sol = solve_ivp(rhs, (0, 24), n0, args=(k,), t_eval=time_hours, method='LSODA', rtol=1e-8, atol=1e-14)

        if not sol.success or sol.y.shape[1] != len(time_hours):
            messagebox.showerror("خطأ في المحاكاة",
                                 "فشل حل المعادلات التفاضلية: راجع قيم الضغط البخاري والأوزان الجزيئية.")
            return

        R_GAS = 8.314462618
        T_K = 305.15

        mass_matrix = sol.y.T * mw
        total_n = sol.y.sum(axis=0)

        x = sol.y / np.where(total_n > 1e-30, total_n, 1.0)[np.newaxis, :]
        vapor_g_m3 = (x.T * p[np.newaxis, :] * mw[np.newaxis, :]) / (R_GAS * T_K)

        ov_matrix = (vapor_g_m3 * 1e6) / odt[np.newaxis, :]

        df_time = pd.DataFrame(mass_matrix, index=time_hours, columns=df['Material'])
        df_ov = pd.DataFrame(ov_matrix, index=time_hours, columns=df['Material'])

        with pd.ExcelWriter(output_filename, engine='openpyxl') as writer:
            df[['Material', 'CAS', 'Parts', 'MW', 'P0', 'ODT', 'ODT_Unit', 'ODT_Source', 'Confidence', 'Mole_Fraction',
                'Partial_Pressure', 'Vapor_Contribution_Pct']].to_excel(writer, sheet_name='Formulation_Summary',
                                                                        index=False)
            df_time.to_excel(writer, sheet_name='Mass_Evaporation_Kinetics')
            df_ov.to_excel(writer, sheet_name='Odor_Value_OV_Curves')

        base_path, _ = os.path.splitext(output_filename)
        chart_image_path = f"{base_path}_OV_chart.png"

        plt.figure(figsize=(10, 6))
        for idx, material in enumerate(df_ov.columns):
            conf = df.loc[df['Material'] == material, 'Confidence'].values[0]
            label_name = f"{material} *" if conf == 'Estimated' else material
            plt.plot(df_ov.index, df_ov[material], label=label_name, linewidth=2)

        plt.axhline(y=1.0, color='r', linestyle='--', label='Threshold Limit (OV = 1)')
        plt.yscale('log')
        plt.ylim(bottom=1e-3)

        plt.title("Dar Kamal Engine: Kinetic OV Model (Odor Value Perception Curves)", fontsize=12, fontweight='bold')
        plt.xlabel("Time (Hours)", fontsize=10)
        plt.ylabel("Odor Value (OV - Log Scale)", fontsize=10)
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=9)
        plt.grid(True, which="both", linestyle="--", alpha=0.6)
        plt.tight_layout()

        plt.savefig(chart_image_path, dpi=300, bbox_inches='tight')
        plt.show(block=False)

        summary_msg = (
            f"تمت محاكاة النموذج الحركي للإحساس الشمي بنجاح!\n"
            f"• نمط التشغيل: {sim_mode} (k = {round(k, 5)})\n"
            f"• ملف التقرير (شيتات Excel مع أعمدة Confidence): {output_filename}\n"
            f"• صورة التشارت: {chart_image_path}"
        )
        messagebox.showinfo("نتائج محرك دار الكمال الحركي", summary_msg)


if __name__ == "__main__":
    root = tk.Tk()
    app = OdorValueEngineApp(root)
    root.mainloop()
