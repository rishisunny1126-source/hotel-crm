import ResourcePage from '../components/ui/ResourcePage';
export default function SelfCheckins() {
  return (
    <ResourcePage title="Self Check-in" subtitle="Guest self check-in submissions" endpoint="/self-checkins"
      writeRoles={['admin','manager','front_desk']}
      filters={[{name:'reviewed',label:'Reviewed',options:['true','false']}]}
      columns={[{key:'guest_name',label:'Guest'},{key:'phone',label:'Phone'},{key:'id_proof_type',label:'ID'},{key:'check_in_date',label:'Check-in'},{key:'reviewed',label:'Reviewed'}]}
      fields={[{name:'guest_name',label:'Guest Name',required:true},{name:'phone',label:'Phone',required:true},{name:'id_proof_type',label:'ID Proof Type'},{name:'id_proof_number',label:'ID Number'},{name:'check_in_date',label:'Check-in',type:'date',required:true},{name:'booking_id',label:'Booking ID (UUID)'}]} />
  );
}
