import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleSaved } from "../store/userSlice";

function SaveButton({ id, name, className = "" }) {
  const user = useSelector((state) => state.user.current);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const saved = Boolean(user?.saved?.includes(id));

  const onClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      toast("Sign in to save homes");
      navigate("/sign-in");
      return;
    }
    try {
      await dispatch(toggleSaved(id)).unwrap();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <button
      type="button"
      aria-label={`${saved ? "Remove" : "Save"} ${name}`}
      aria-pressed={saved}
      onClick={onClick}
      className={`h-10 w-10 rounded-full bg-white/95 text-slate-800 shadow flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-110 ${className}`}
    >
      <Heart
        size={18}
        aria-hidden="true"
        className={saved ? "fill-red-500 text-red-500" : ""}
      />
    </button>
  );
}

export default SaveButton;
