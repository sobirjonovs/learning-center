/** Toast xabarlari — yaratildi / o'zgartirildi / o'chirildi va hokazo. */
export const MSGS = {
  created: (name?: string) => (name ? `"${name}" yaratildi` : "Muvaffaqiyatli yaratildi"),
  updated: (name?: string) => (name ? `"${name}" o'zgartirildi` : "Muvaffaqiyatli o'zgartirildi"),
  deleted: (name?: string) => (name ? `"${name}" o'chirildi` : "O'chirildi"),
  saved: "Saqlanldi",
  marked: "Belgilandi",
  sent: "Yuborildi",
  activated: (name?: string) => (name ? `"${name}" faollashtirildi` : "Faollashtirildi"),
  deactivated: (name?: string) => (name ? `"${name}" faolsizlantirildi` : "Faolsizlantirildi"),
  failed: "Amal bajarilmadi. Qayta urinib ko'ring.",
} as const;
