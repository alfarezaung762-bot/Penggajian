/**
 * Calculator PPh 21 berdasarkan PTKP (Status Pernikahan & Jumlah Tanggungan)
 */

export function calculatePTKP(statusPernikahan: 'TK' | 'K', jumlahTanggungan: number): number {
  const baseTK = 54000000; // PTKP dasar Wajib Pajak Sendiri
  const kawinBonus = statusPernikahan === 'K' ? 4500000 : 0;
  const tanggunganBonus = Math.min(Math.max(0, jumlahTanggungan), 3) * 4500000;
  return baseTK + kawinBonus + tanggunganBonus;
}

export function calculatePPh21Monthly(gajiBrutoBulanan: number, statusPernikahan: 'TK' | 'K', jumlahTanggungan: number): number {
  const brutoTahunan = gajiBrutoBulanan * 12;
  const ptkp = calculatePTKP(statusPernikahan, jumlahTanggungan);
  const pkpTahunan = brutoTahunan - ptkp;

  if (pkpTahunan <= 0) return 0;

  // Skema Tarif Progresif UU HPP Pasal 17
  let sisaPKP = pkpTahunan;
  let pphTahunan = 0;

  // Lapis 1: 0 - 60 Juta (5%)
  const layer1 = Math.min(sisaPKP, 60000000);
  pphTahunan += layer1 * 0.05;
  sisaPKP -= layer1;

  if (sisaPKP > 0) {
    // Lapis 2: > 60 Juta - 250 Juta (15%)
    const layer2 = Math.min(sisaPKP, 190000000);
    pphTahunan += layer2 * 0.15;
    sisaPKP -= layer2;
  }

  if (sisaPKP > 0) {
    // Lapis 3: > 250 Juta - 500 Juta (25%)
    const layer3 = Math.min(sisaPKP, 250000000);
    pphTahunan += layer3 * 0.25;
    sisaPKP -= layer3;
  }

  if (sisaPKP > 0) {
    // Lapis 4: > 500 Juta - 5 Miliar (30%)
    const layer4 = Math.min(sisaPKP, 4500000000);
    pphTahunan += layer4 * 0.30;
    sisaPKP -= layer4;
  }

  if (sisaPKP > 0) {
    // Lapis 5: > 5 Miliar (35%)
    pphTahunan += sisaPKP * 0.35;
  }

  return Math.round(pphTahunan / 12);
}
