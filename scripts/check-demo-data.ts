import { temmuz15Martyrs } from '../lib/data/temmuz15_martyrs';
import { demoHeroes } from '../lib/demo';
import { canAutoEnrichHero, recordDisambiguator } from '../lib/heroRecords';

function fail(message: string): void {
  throw new Error(`Veri denetimi başarısız: ${message}`);
}

const expectedMartyrCount = 240;

if (temmuz15Martyrs.length !== expectedMartyrCount) {
  fail(`15 Temmuz kayıt sayısı ${expectedMartyrCount} olmalı, ${temmuz15Martyrs.length} bulundu.`);
}

const ids = new Set<string>();
for (const hero of demoHeroes) {
  if (ids.has(hero.id)) fail(`Yinelenen kayıt kimliği: ${hero.id}`);
  ids.add(hero.id);
}

const reviewRequiredIds = ['msb-95', 'msb-107923', 'msb-23988', 'msb-109689', 'mc-120', 'd-h44'];
for (const id of reviewRequiredIds) {
  const hero = demoHeroes.find((item) => item.id === id);
  if (!hero || hero.status !== 'pending') {
    fail(`${id} eksik veya şüpheli ad kaydı inceleme kuyruğuna alınmadı.`);
  }
}

for (const hero of temmuz15Martyrs) {
  if (!hero.id.startsWith('t15-')) fail(`${hero.full_name} için geçersiz kayıt kimliği.`);
  if (hero.conflict_id !== 'd-6' || hero.conflict?.id !== 'd-6') {
    fail(`${hero.full_name} 15 Temmuz kategorisine bağlı değil.`);
  }
  if (!hero.is_martyr || hero.is_veteran || hero.status !== 'approved') {
    fail(`${hero.full_name} için şehit/gazi veya yayın durumu tutarsız.`);
  }
  if (!hero.full_name.trim() || !hero.death_date) {
    fail(`${hero.id} için zorunlu ad veya şehadet tarihi eksik.`);
  }
  if (hero.birth_date !== null || hero.death_place !== null || hero.story !== null || hero.summary !== null) {
    fail(`${hero.full_name} için doğrulanmamış ayrıntı yayımlanıyor.`);
  }
}

for (const hero of demoHeroes) {
  if (!hero.full_name.trim()) fail(`${hero.id} için boş kişi adı yayımlanıyor.`);
  if (hero.id.startsWith('msb-')) {
    if (!recordDisambiguator(hero)?.includes('MSB sicil no:')) {
      fail(`${hero.full_name} için MSB ayırt edici kaynak kimliği eksik.`);
    }
    if (canAutoEnrichHero(hero)) {
      fail(`${hero.full_name} için belirsiz MSB kaydında otomatik dış kaynak açık.`);
    }
    if (/(None|Cephes Cephesi)/.test([hero.summary, hero.story].join(' '))) {
      fail(`${hero.full_name} için ham metin kalıntısı yayımlanıyor.`);
    }
  }
}

console.log(
  `Veri denetimi başarılı: ${demoHeroes.length} demo kaydı, ${temmuz15Martyrs.length} adet 15 Temmuz şehidi.`
);
