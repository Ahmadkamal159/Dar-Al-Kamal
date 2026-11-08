import tkinter as tk
from tkinter import ttk, messagebox
import pyodbc
import pandas as pd

SERVER = 'AhmadKamal'
DATABASE = 'Dar_AlKamal_DB'
CONNECTION_STRING = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={SERVER};DATABASE={DATABASE};Trusted_Connection=yes;'


def get_db_connection():
    return pyodbc.connect(CONNECTION_STRING)


class MaterialManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("دار الكمال - إدارة قاعدة بيانات المواد العطرية")
        self.root.geometry("850x600")
        self.root.config(bg="#f4f6f9")

        self.create_widgets()
        self.load_materials()

    def create_widgets(self):
        title_label = tk.Label(self.root, text="دار الكمال | لوحة التحكم في قاعدة بيانات المواد الخام (CRUD)",
                               font=("Arial", 14, "bold"), bg="#f4f6f9", fg="#1e293b")
        title_label.pack(pady=10)

        # إطار النموذج (Form Frame) لإدخال وتعديل البيانات
        form_frame = tk.LabelFrame(self.root, text=" بيانات الخامة العطرية ", font=("Arial", 10, "bold"), bg="#f4f6f9",
                                   padx=10, pady=10)
        form_frame.pack(fill=tk.X, padx=20, pady=5)

        # الحقول
        fields = [
            ("اسم المادة (Name):", 0, 0),
            ("رقم CAS:", 2, 0),
            ("الوزن الجزيئي (MW):", 4, 0),
            ("الضغط البخاري (P0):", 0, 2),
            ("عتبة الشم (ODT ng/L):", 2, 2),
            ("الفئة (Category):", 4, 2),
            ("مستوى الثقة (Confidence):", 6, 0)
        ]

        self.entries = {}
        for label_text, r, c in fields:
            lbl = tk.Label(form_frame, text=label_text, bg="#f4f6f9", font=("Arial", 9))
            lbl.grid(row=r, column=c, sticky="w", padx=5, pady=3)

            if "Category" in label_text:
                ent = ttk.Combobox(form_frame, values=["Top", "Heart", "Base"], width=18, font=("Arial", 9))
            elif "Confidence" in label_text:
                ent = ttk.Combobox(form_frame, values=["High", "Estimated", "Unknown"], width=18, font=("Arial", 9))
            else:
                ent = tk.Entry(form_frame, width=20, font=("Arial", 9))

            ent.grid(row=r, column=c + 1, padx=5, pady=3, sticky="w")
            self.entries[label_text] = ent

        # أزرار التحكم
        btn_frame = tk.Frame(form_frame, bg="#f4f6f9")
        btn_frame.grid(row=7, column=0, columnspan=4, pady=10)

        tk.Button(btn_frame, text="حفظ / إضافة جديد", bg="#0284c7", fg="white", font=("Arial", 10, "bold"), padx=10,
                  command=self.save_material).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="تفريغ الحقول", bg="#64748b", fg="white", font=("Arial", 10, "bold"), padx=10,
                  command=self.clear_form).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="حذف المادة المحددة", bg="#dc2626", fg="white", font=("Arial", 10, "bold"), padx=10,
                  command=self.delete_material).pack(side=tk.LEFT, padx=5)

        # جدول عرض المواد (Treeview)
        table_frame = tk.Frame(self.root, bg="#f4f6f9")
        table_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        columns = ("Name", "CAS", "MW", "P0", "ODT", "Category", "Confidence")
        self.tree = ttk.Treeview(table_frame, columns=columns, show="headings", height=10)

        for col in columns:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=110, anchor="center")

        scrollbar = ttk.Scrollbar(table_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)

        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.tree.bind("<ButtonRelease-1>", self.on_row_select)

    def load_materials(self):
        for row in self.tree.get_children():
            self.tree.delete(row)
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT Name, CAS_Number, MolecularWeight, VaporPressure, ODT, Category, Confidence FROM FragranceMaterials")
            for row in cursor.fetchall():
                self.tree.insert("", tk.END, values=(row[0], row[1], row[2], row[3], row[4], row[5], row[6]))
            conn.close()
        except Exception as e:
            messagebox.showerror("خطأ", f"تعذر تحميل البيانات:\n{e}")

    def on_row_select(self, event):
        selected_item = self.tree.selection()
        if not selected_item:
            return
        values = self.tree.item(selected_item, "values")

        # تعبئة الحقول بالبيانات المحددة للتعديل الفوري
        keys = list(self.entries.keys())
        for i, val in enumerate(values):
            ent = self.entries[keys[i]]
            if isinstance(ent, ttk.Combobox):
                ent.set(val)
            else:
                ent.delete(0, tk.END)
                ent.insert(0, val)

    def save_material(self):
        name = self.entries["اسم المادة (Name):}"].get() if "اسم المادة (Name):}" in self.entries else self.entries[
            "اسم المادة (Name):"].get().strip()
        # تصحيح مفتاح الدكشنري بناء على التسمية الفعليّة
        name_val = self.entries["اسم المادة (Name):"].get().strip()
        cas_val = self.entries["رقم CAS:"].get().strip()
        mw_val = self.entries["الوزن الجزيئي (MW):"].get().strip()
        p0_val = self.entries["الضغط البخاري (P0):"].get().strip()
        odt_val = self.entries["عتبة الشم (ODT ng/L):"].get().strip()
        cat_val = self.entries["الفئة (Category)::"].get() if "الفئة (Category)::" in self.entries else self.entries[
            "الفئة (Category):"].get()
        conf_val = self.entries["مستوى الثقة (Confidence)::"].get() if "مستوى الثقة (Confidence)::" in self.entries else \
        self.entries["مستوى الثقة (Confidence):"].get()

        if not name_val or not mw_val or not p0_val or not odt_val:
            messagebox.showerror("تنبيه", "برجاء إدخال الحقول الأساسية (الاسم، MW، P0، ODT) على الأقل!")
            return

        try:
            mw = float(mw_val)
            VaporPressure = float(p0_val)
            odt = float(odt_val)
        except ValueError:
            messagebox.showerror("خطأ", "القيم العددية (MW, P0, ODT) يجب أن تكون أرقام صحيحة أو عشرية!")
            return

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # التحقق هل المادة موجودة مسبقاً لتحديثها أم إضافتها كجديدة
            cursor.execute("SELECT COUNT(*) FROM FragranceMaterials WHERE Name = ?", (name_val,))
            exists = cursor.fetchone()[0]

            if exists > 0:
                cursor.execute("""
                    UPDATE FragranceMaterials 
                    SET CAS_Number=?, MolecularWeight=?, VaporPressure=?, ODT=?, Category=?, Confidence=?, ODT_Unit='ng/L'
                    WHERE Name=?
                """, (cas_val, mw, VaporPressure, odt, cat_val, conf_val, name_val))
                msg = f"تم تحديث بيانات المادة ({name_val}) بنجاح!"
            else:
                cursor.execute("""
                    INSERT INTO FragranceMaterials (Name, CAS_Number, MolecularWeight, P0, ODT, Category, Confidence, ODT_Unit)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'ng/L')
                """, (name_val, cas_val, mw, VaporPressure, odt, cat_val, conf_val))
                msg = f"تمت إضافة المادة ({name_val}) بنجاح!"

            conn.commit()
            conn.close()
            messagebox.showinfo("تم", msg)
            self.load_materials()
            self.clear_form()
        except Exception as e:
            messagebox.showerror("خطأ في القاعدة", f"حدث خطأ أثناء حفظ البيانات:\n{e}")

    def clear_form(self):
        for ent in self.entries.values():
            if isinstance(ent, ttk.Combobox):
                ent.set('')
            else:
                ent.delete(0, tk.END)

    def delete_material(self):
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("تنبيه", "الرجاء اختيار المادة المراد حذفها من الجدول أولاً.")
            return

        values = self.tree.item(selected_item, "values")
        name_val = values[0]

        if messagebox.askyesno("تأكيد الحذف", f"هل أنت متأكد من حذف المادة ({name_val}) نهائياً من قاعدة البيانات؟"):
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("DELETE FROM FragranceMaterials WHERE Name = ?", (name_val,))
                conn.commit()
                conn.close()
                messagebox.showinfo("تم", f"تم حذف المادة ({name_val}) بنجاح.")
                self.load_materials()
                self.clear_form()
            except Exception as e:
                messagebox.showerror("خطأ", f"تعذر حذف المادة:\n{e}")


if __name__ == "__main__":
    root = tk.Tk()
    app = MaterialManagerApp(root)
    root.mainloop()