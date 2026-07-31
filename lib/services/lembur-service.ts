/**
 * Service Kalkulasi Lembur
 */

export function calculateUpahPerJam(gajiPokok: number): number {
  return gajiPokok / 173;
}

export function calculateNominalLembur(
  gajiPokok: number,
  totalMenitLembur: number,
  multiplier: number
): number {
  if (totalMenitLembur <= 0) return 0;
  const upahPerJam = calculateUpahPerJam(gajiPokok);
  const totalJam = totalMenitLembur / 60;
  return Math.round(totalJam * upahPerJam * multiplier);
}
