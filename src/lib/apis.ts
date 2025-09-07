export const getToken = () => {
  return localStorage.getItem("token") || "";
};

export const getHeaders = () => ({
  "Auth-Key": "appxapi",
  "Device-Type": "",
  "Client-Service": "Appx",
  Source: "windows",
  Authorization: getToken(),
});

export const loginApi = async (email: string, password: string) => {
  const form = new FormData();
  form.append("source", "windows");
  form.append("phone", email);
  form.append("email", email);
  form.append("password", password);
  form.append("mydeviceid", "PG035NTJ");
  form.append("extra_details", "1");

  const res = await fetch(
    "https://jagrutawaazapi.classx.co.in/post/userLogin?extra_details=0",
    {
      method: "POST",
      body: form,
      headers: {
        "Auth-Key": "appxapi",
        "Client-Service": "Appx",
        Source: "windows",
      },
    }
  );

  const data = (await res.json()) as {
    status: number;
    data: {
      userid: string;
      token: string;
    };
  };

  return data;
};

export const fetchCourses = async () => {
  const res = await fetch(
    "https://jagrutawaazapi.classx.co.in/get/get_all_purchases?userid=0",
    {
      headers: getHeaders(),
    }
  );

  const data = (await res.json()) as {
    status: number;
    data: {
      purchaseid: string;
      itemid: string;
      coursedt: {
        id: string;
        course_name: string;
        course_description: string;
        course_thumbnail: string;
      }[];
    }[];
  };

  return data;
};

export const fetchCourseDetails = async (courseId: string) => {
  const res = await fetch(
    "https://jagrutawaazapi.classx.co.in/get/coursenew_by_idv2?id=" + courseId,
    {
      headers: getHeaders(),
    }
  );

  const data = (await res.json()) as {
    status: number;
    data: {
      id: string;
      course_name: string;
      course_description: string;
      course_thumbnail: string;
    }[];
  };

  return data;
};

export const fetchFolderContents = async (
  folderId: string,
  courseId: string
) => {
  const res = await fetch(
    `https://jagrutawaazapi.classx.co.in/get/folder_contentsv3?course_id=${courseId}&parent_id=${folderId}&windowsapp=true&start=0`,
    {
      headers: getHeaders(),
    }
  );

  const data = (await res.json()) as {
    status: number;
    data: {
      id: string;
      parent_id: string;
      Title: string;
      material_type: string;
      download_link: string;
    }[];
  };

  return data;
};

export const fetchParentFolders = async (
  folderId: string,
  courseId: string
) => {
  const res = await fetch(
    `https://jagrutawaazapi.classx.co.in/get/parent_folder_contents?course_id=${courseId}&current_folder_id=${folderId}`,
    {
      headers: getHeaders(),
    }
  );

  const data = (await res.json()) as {
    status: number;
    data: {
      id: string;
      title: string;
    }[];
  };

  return data;
};

export const fetchVideoDetails = async (videoId: string, courseId: string) => {
  const res = await fetch(
    `https://jagrutawaazapi.classx.co.in/get/fetchVideoDetailsById?course_id=${courseId}&video_id=${videoId}&folder_wise_course=1&lc_app_api_url=&ytflag=0`,
    {
      headers: getHeaders(),
    }
  );

  console.log(res.status, res.statusText);

  const data = (await res.json()) as {
    status: number;
    data: {
      id: string;
      Title: string;
      file_link: string;
      download_link: string;
      download_links: {
        bitrate: string;
        quality: string;
        path: string;
        backup_url: string;
        backup_url2: string;
      }[];
    };
  };

  return data;
};
