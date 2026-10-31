import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import ListingForm from "../components/ListingForm";
import { api, post } from "../lib/api";

function EditListing() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [failed, setFailed] = useState(false);
  const user = useSelector((state) => state.user.current);
  const navigate = useNavigate();

  useEffect(() => {
    api(`/listing/get/${id}`).then(setListing).catch(() => setFailed(true));
  }, [id]);

  if (failed || (listing && listing.userRef !== user._id)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (!listing) return <div className="min-h-[60vh]" />;

  const submit = async (values) => {
    await post(`/listing/update/${id}`, values);
    toast.success("Listing updated");
    navigate(`/listing/${id}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Edit listing</h1>
      <ListingForm initial={listing} submitLabel="Save changes" onSubmit={submit} />
    </div>
  );
}

export default EditListing;
