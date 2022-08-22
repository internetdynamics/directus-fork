import { useState, useEffect, useRef, Fragment } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import CogIcon from "./icons/cog.svg";
import User from "./icons/user.svg";
import Lock from "./icons/lock.svg";
import LogOut from "./icons/sign-out.svg";
import Cross from "./icons/cross-small.svg";
import { CSSTransition } from "react-transition-group";
import { signOut } from "next-auth/react";
import axios from "axios";
import getUserData from "../../helpers/getUserData";
import { toast } from "../../utils/toast";
import { Directus } from "@directus/sdk";

const NavMenu = () => {
  const assetsUrl = process.env.NEXT_PUBLIC_ASSETS_URL;
  const [avatar, setAvatar] = useState("");
  const [userData, setUserData] = useState("");
  const [open, setOpen] = useState(false);

  const { data: session, status } = useSession({
    required: true
  });

  const updateUser = async () => {
    const user = await getUserData(session.user.accessToken);
    setAvatar(user.avatar);
    setUserData(user);
  };

  useEffect(() => {
    document.addEventListener("click", setOpenClose);

    async function initialFetch() {
      const user = await getUserData(session.user.accessToken);
      setAvatar(user.avatar);
      setUserData(user);
    }
    if (status === "authenticated") {
      initialFetch();
    }

    return () => {
      window.removeEventListener("click", setOpenClose);
    };
  }, [status]); // When status changes to authenticated code will execute, going from loading... to authenticated

  const setOpenClose = (evt) => {
    let targetElId = evt.target.id;
    let targetElTagname = evt.target.tagName;
    let targetElParentTagname = evt.target.parentElement?.tagName;
    if (
      targetElId !== "dropdown" &&
      targetElId !== "avatar" &&
      targetElId !== "avatarinput" &&
      targetElTagname !== "svg" &&
      targetElParentTagname !== "svg"
    ) {
      setOpen(false);
    }
  };

  function NavItem(props) {
    return (
      <div className="nav-item">
        {avatar ? (
          <img
            id="avatar"
            className="prose object-cover w-11 h-11 rounded-full bg-white p-0.5"
            onClick={() => setOpen(!open)}
            src={`${assetsUrl}/${avatar}?width=385&height=385`}
            alt=""
          />
        ) : (
          <img
            id="avatar"
            className="prose object-cover w-11 h-11 rounded-full bg-white p-0.5"
            onClick={() => setOpen(!open)}
            src={"/images/avatar.png"}
            alt=""
          />
        )}
        {open && props.children}
      </div>
    );
  }

  const handleChange = (e) => {
    uploadImage(e.target.files);
  };

  const uploadImage = async (files) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = apiBaseUrl + "/files";
    const fileInput = document.querySelector('input[type="file"]');
    const formData = new FormData();

    if (fileInput.files[0]) {
      formData.append("file", fileInput.files[0]);
    } else {
      formData.append("files", files[0]);
    }

    let config = {
      method: "post",
      url: url,
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${session.user.accessToken}`
      },
      data: formData
    };
    await axios(config)
      .then((response) => {
        const avatarImageId = response.data.data.id;
        const userId = response.data.data.uploaded_by;
        updateUserData(session.user.accessToken, userId, avatarImageId);
      })
      .catch((error) => {
        toast(
          "error",
          "Avatar Upload Failed",
          "An error occurred, please try again"
        );
      });
  };

  const updateUserData = async (accessToken, userId, avatarImageId) => {
    const directus = new Directus(process.env.NEXT_PUBLIC_API_BASE_URL);
    try {
      const previousFileId = userData.avatar;
      const user = await directus.users.me.update(
        { id: userId, avatar: avatarImageId },
        { access_token: accessToken }
      );
      updateUser();
      setOpen(!open);
      if (previousFileId) {
        deleteFile(previousFileId);
      }
    } catch (err) {
      toast(
        "error",
        "User Avatar Upload Failed",
        "An error occurred, please try again"
      );
    }
  };

  const deleteFile = async (fileId) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = apiBaseUrl + "/files/" + fileId;

    if (fileId) {
      let config = {
        method: "delete",
        url: url,
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`
        }
      };
      await axios(config);
    }
  };

  function DropdownMenu() {
    const [activeMenu, setActiveMenu] = useState("main");
    const [menuHeight, setMenuHeight] = useState(null);

    // useRef is a hook that allows to directly create a reference to the DOM element in the functional component
    // will not trigger re-render
    const dropdownRef = useRef(null);

    // By using this Hook, you tell React that your component needs to do something after render
    useEffect(() => {
      setMenuHeight(dropdownRef.current?.firstChild.offsetHeight + 28);
    }, []);

    // Sets Menu Height
    function calcHeight(el) {
      const height = el.offsetHeight;
      setMenuHeight(height + 28);
    }

    function handleClickSignOut() {
      signOut({ callbackUrl: "/" });
    }

    const removeAvatar = async () => {
      const directus = new Directus(process.env.NEXT_PUBLIC_API_BASE_URL);
      const fileId = userData.avatar;
      try {
        if (userData.id && userData.avatar) {
          await directus.users.me.update(
            { id: userData.id, avatar: null },
            { access_token: session.user.accessToken }
          );
          updateUser();
          deleteFile(fileId);
        }
      } catch (err) {
        toast(
          "error",
          "User Avatar Removal Failed",
          "An error occurred, please try again"
        );
      }
    };

    function DropdownItem(props) {
      return (
        <>
          {props.link ? (
            <div onClick={() => setOpen(!open)}>
              <Link href={props.href || "#"}>
                <a
                  id="dropdown"
                  className="menu-item"
                  onClick={() =>
                    props.goToMenu && setActiveMenu(props.goToMenu)
                  }
                >
                  <span className="icon-button">{props.icon}</span>
                  {props.children}
                </a>
              </Link>
            </div>
          ) : (
            <div className="menu-item">
              <span className="icon-button">{props.icon}</span>
              {props.children}
            </div>
          )}
        </>
      );
    }

    return (
      <div
        className="dropdown"
        style={{ height: menuHeight }}
        ref={dropdownRef}
      >
        <CSSTransition
          in={activeMenu === "main"}
          timeout={500}
          classNames="menu-primary"
          unmountOnExit
          onEnter={calcHeight}
        >
          <div className="menu">
            <DropdownItem icon={<User />} href="/user-area" link={true}>
              {userData.email}
            </DropdownItem>
            <DropdownItem icon={<CogIcon />} link={false}>
              <div>
                <label>
                  <span id="avatarinput" className="pr-24">
                    Update Avatar
                  </span>
                  <input
                    id="avatarinput"
                    type="file"
                    className="hidden"
                    onChange={(e) => handleChange(e)}
                  />
                </label>
              </div>
            </DropdownItem>
            <div className="cursor-pointer" onClick={() => removeAvatar()}>
              <DropdownItem icon={<Cross />} link={false}>
                Remove Avatar
              </DropdownItem>
            </div>
            <DropdownItem
              icon={<Lock />}
              href="/request-pass-reset"
              link={true}
            >
              Reset Password
            </DropdownItem>
            <div onClick={() => handleClickSignOut()}>
              <DropdownItem icon={<LogOut />} href="/" link={true}>
                Sign Out
              </DropdownItem>
            </div>
          </div>
        </CSSTransition>
      </div>
    );
  }

  return (
    <Fragment>
      <NavItem>
        <DropdownMenu></DropdownMenu>
      </NavItem>
    </Fragment>
  );
};

export default NavMenu;
