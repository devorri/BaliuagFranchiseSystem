import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jauxmhmhyqkmestlhaln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphdXhtaG1oeXFrbWVzdGxoYWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMDAxMjgsImV4cCI6MjEwNjg3NjEyOH0.kUoo13qUucFG803DvTUPfUeaKwgpER-vbiUMu2bS79s';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const baseStorageUrl = 'https://jauxmhmhyqkmestlhaln.supabase.co/storage/v1/object/public/Files/registration_documents/';

const randyDocs = [
  { id: 'reg-doc-randy-0', name: '2x2 ID Photo / Valid Government ID', type: 'id_photo', fileName: '1792731110051_joqabk.jpg', fileUrl: baseStorageUrl + '1792731110051_joqabk.jpg', status: 'uploaded', uploadedAt: '2026-10-23T04:51:51.152Z' },
  { id: 'reg-doc-randy-1', name: 'Barangay Clearance', type: 'barangay_clearance', fileName: '1792731114713_hwceff.png', fileUrl: baseStorageUrl + '1792731114713_hwceff.png', status: 'uploaded', uploadedAt: '2026-10-23T04:51:54.919Z' },
  { id: 'reg-doc-randy-2', name: "Driver's License", type: 'drivers_license', fileName: '1792731118808_7ad3by.jpg', fileUrl: baseStorageUrl + '1792731118808_7ad3by.jpg', status: 'uploaded', uploadedAt: '2026-10-23T04:51:59.126Z' },
  { id: 'reg-doc-randy-3', name: 'Proof of Unit Ownership (OR/CR)', type: 'or_cr', fileName: '1792731123780_bcm8r3.jpg', fileUrl: baseStorageUrl + '1792731123780_bcm8r3.jpg', status: 'uploaded', uploadedAt: '2026-10-23T04:52:04.010Z' },
  { id: 'reg-doc-randy-4', name: 'TODA Endorsement / Cert', type: 'toda_cert', fileName: '1792731141207_7zjass.jpg', fileUrl: baseStorageUrl + '1792731141207_7zjass.jpg', status: 'uploaded', uploadedAt: '2026-10-23T04:52:21.771Z' }
];

const dudsDocs = [
  { id: 'reg-doc-duds-0', name: '2x2 ID Photo / Valid Government ID', type: 'id_photo', fileName: '1792731457510_4sf71u.jpg', fileUrl: baseStorageUrl + '1792731457510_4sf71u.jpg', status: 'uploaded', uploadedAt: '2026-10-23T04:57:37.873Z' },
  { id: 'reg-doc-duds-1', name: 'Barangay Clearance', type: 'barangay_clearance', fileName: '1792731461507_rm4r16.png', fileUrl: baseStorageUrl + '1792731461507_rm4r16.png', status: 'uploaded', uploadedAt: '2026-10-23T04:57:41.757Z' },
  { id: 'reg-doc-duds-2', name: "Driver's License", type: 'drivers_license', fileName: '1792731466360_ja7qxh.jpg', fileUrl: baseStorageUrl + '1792731466360_ja7qxh.jpg', status: 'uploaded', uploadedAt: '2026-10-23T04:57:46.693Z' },
  { id: 'reg-doc-duds-3', name: 'Proof of Unit Ownership (OR/CR)', type: 'or_cr', fileName: '1792731470361_auwowo.jpg', fileUrl: baseStorageUrl + '1792731470361_auwowo.jpg', status: 'uploaded', uploadedAt: '2026-10-23T04:57:50.802Z' },
  { id: 'reg-doc-duds-4', name: 'TODA Endorsement / Cert', type: 'toda_cert', fileName: '1792731474653_w7uobu.jpg', fileUrl: baseStorageUrl + '1792731474653_w7uobu.jpg', status: 'uploaded', uploadedAt: '2026-10-23T04:57:54.925Z' }
];

async function run() {
  const res1 = await supabase.from('audit_logs').insert([{
    user_id: '5bf5286b-9b8f-4e25-b12c-1d05984822a9',
    user_name: 'randy orton',
    user_role: 'operator',
    action: 'REGISTRATION_DOCUMENTS',
    details: JSON.stringify(randyDocs),
    target_id: '5bf5286b-9b8f-4e25-b12c-1d05984822a9',
    ip_address: '127.0.0.1'
  }]);
  console.log('RANDY log insert:', res1.error ? res1.error.message : 'SUCCESS');

  const res2 = await supabase.from('audit_logs').insert([{
    user_id: '8ab2022a-95df-4686-ab1e-eaf51fea1717',
    user_name: 'duds duds',
    user_role: 'operator',
    action: 'REGISTRATION_DOCUMENTS',
    details: JSON.stringify(dudsDocs),
    target_id: '8ab2022a-95df-4686-ab1e-eaf51fea1717',
    ip_address: '127.0.0.1'
  }]);
  console.log('DUDS log insert:', res2.error ? res2.error.message : 'SUCCESS');
}

run();
