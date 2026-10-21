/* Сургалтын бүртгэлийн маягт
   Бөглөсөн мэдээллийг FormSubmit (formsubmit.co) үйлчилгээгээр компанийн имэйл (info@) руу илгээнэ.
   Компани төлбөрийн нэхэмжлэхийг гараар илгээнэ. Имэйлийн «Reply» дарахад шууд суралцагч руу хариу бичигдэнэ. */
(function () {
  "use strict";
  var form = document.getElementById("reg-form");
  if (!form) return;

  var to = form.getAttribute("data-company-email");
  var LABELS = {
    course: "Сургалт",
    price: "Сургалтын төлбөр",
    name: "Овог, нэр",
    phone: "Утас",
    email: "Google (Gmail) хаяг",
    payer: "Төлбөр төлөгч",
    org_name: "Байгууллагын нэр",
    org_reg: "Регистрийн дугаар",
    count: "Оролцогчийн тоо",
    notes: "Нэмэлт мэдээлэл",
    interest: "Сонирхсон сургалт"
  };
  var T = {
    sending: "Илгээж байна…",
    submit: "Бүртгүүлэх",
    invalid: "Одоор (*) тэмдэглэсэн талбаруудыг бөглөнө үү. Google хаягаа зөв оруулсан эсэхээ шалгана уу.",
    failed: "Бүртгэлийг илгээж чадсангүй. Хэсэг хугацааны дараа дахин оролдоно уу. Асуудал давтагдвал " + to + " хаяг руу имэйл бичих эсвэл утсаар холбогдоно уу."
  };

  var select = document.getElementById("r-course");
  var courseNote = document.getElementById("r-course-note");
  var orgBox = document.getElementById("r-org");
  var orgHint = document.getElementById("r-org-hint");
  var errBox = document.getElementById("r-error");
  var btn = document.getElementById("r-submit");
  var interestTitle = "";

  var courses = [];
  try { courses = JSON.parse(document.getElementById("course-data").textContent) || []; } catch (e) {}
  function courseByKey(key) {
    for (var i = 0; i < courses.length; i++) if (courses[i].key === key) return courses[i];
    return null;
  }

  /* 1. Хаягаас сургалтыг урьдчилан сонгох: /burtguuleh/?course=<key>, ?interest=1, ?payer=org */
  var params = new URLSearchParams(location.search);
  var wanted = params.get("course") || "";
  var matched = false;
  if (wanted && !params.get("interest")) {
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].getAttribute("data-key") === wanted) { select.selectedIndex = i; matched = true; break; }
    }
  }
  if (!matched && (wanted || params.get("interest"))) {
    var c = courseByKey(wanted);
    select.value = "Удахгүй нээгдэх сургалтын мэдээлэл авах";
    if (c) {
      interestTitle = c.title;
      courseNote.textContent = "«" + c.title + "» сургалтын бүртгэл одоогоор нээлттэй биш байна. Дараагийн анги нээгдэхэд тантай холбогдоно.";
      courseNote.hidden = false;
    }
  }
  if (params.get("payer") === "org") {
    var orgRadio = form.querySelector('input[name="payer"][value="Байгууллага"]');
    if (orgRadio) orgRadio.checked = true;
  }

  function selectedStatus() {
    var opt = select.options[select.selectedIndex];
    return opt ? opt.getAttribute("data-status") || "" : "";
  }

  /* 2. Байгууллагын талбарууд: «Байгууллага» сонгосон үед л харагдаж, заавал бөглөнө */
  function syncPayer() {
    var isOrg = !!form.querySelector('input[name="payer"][value="Байгууллага"]:checked');
    orgBox.hidden = !isOrg;
    orgHint.hidden = !isOrg;
    orgBox.querySelectorAll("[data-org]").forEach(function (el) {
      el.disabled = !isOrg;
      if (!isOrg) { var w = el.closest(".q-field"); if (w) w.classList.remove("is-invalid"); }
    });
  }
  syncPayer();

  function showError(msg) {
    errBox.textContent = msg;
    errBox.hidden = false;
    errBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function validate() {
    errBox.hidden = true;
    var ok = true, first = null;
    form.querySelectorAll("[required]").forEach(function (el) {
      if (el.disabled) return;
      var v = String(el.value || "").trim();
      var bad = el.type === "checkbox" ? !el.checked : !v;
      if (!bad && el.type === "email") bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (!bad && el.type === "number") { var n = Number(v); bad = !(n >= 1 && n <= 500 && Math.floor(n) === n); }
      if (!bad && el.type === "tel") bad = v.replace(/\D/g, "").length < 8;
      var wrap = el.closest(".q-field, .q-check");
      if (wrap) wrap.classList.toggle("is-invalid", bad);
      if (bad) { ok = false; first = first || el; }
    });
    if (!ok) {
      showError(T.invalid);
      if (first) first.focus({ preventScroll: true });
    }
    return ok;
  }

  function collect() {
    var fd = new FormData(form), data = {};
    ["course", "name", "phone", "email", "payer", "org_name", "org_reg", "count", "notes"].forEach(function (k) {
      data[k] = String(fd.get(k) || "").trim();
    });
    var opt = select.options[select.selectedIndex];
    data.price = opt ? opt.getAttribute("data-price") || "" : "";
    data.interest = selectedStatus() === "interest" ? interestTitle : "";
    if (data.payer !== "Байгууллага") { data.org_name = ""; data.org_reg = ""; data.count = ""; }
    return data;
  }

  function done(data) {
    var status = selectedStatus();
    if (typeof window.gtag === "function") {
      window.gtag("event", "generate_lead", { form_name: "registration", course: data.course, payer: data.payer === "Байгууллага" ? "org" : "person" });
    }
    var pay = status === "open";
    document.getElementById("reg-done-pay").hidden = !pay;
    document.getElementById("reg-done-soon").hidden = pay;
    document.querySelectorAll("[data-done-email]").forEach(function (el) { el.textContent = data.email; });
    form.hidden = true;
    var box = document.getElementById("reg-done");
    box.hidden = false;
    box.focus();
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("change", function (e) {
    var f = e.target.closest(".q-field, .q-check");
    if (f) f.classList.remove("is-invalid");
    if (e.target.name === "payer") syncPayer();
    if (e.target === select) { courseNote.hidden = true; if (selectedStatus() !== "interest") interestTitle = ""; }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.elements.website && form.elements.website.value) return; // спам
    if (!validate()) return;
    var data = collect();

    var payload = {};
    ["course", "interest", "price", "name", "phone", "email", "payer", "org_name", "org_reg", "count", "notes"].forEach(function (k) {
      if (data[k]) payload[LABELS[k]] = data[k];
    });
    payload._replyto = data.email;
    payload._subject = "Сургалтын бүртгэл: " + (data.interest || data.course) + " — " + (data.org_name || data.name);
    payload._template = "table";
    payload._captcha = "false";

    btn.disabled = true;
    btn.textContent = T.sending;
    var fail = function () {
      btn.disabled = false;
      btn.textContent = T.submit;
      showError(T.failed);
    };
    fetch("https://formsubmit.co/ajax/" + encodeURIComponent(to), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res && String(res.success) === "true") { done(data); }
      else { if (window.console) console.warn("FormSubmit:", res && res.message); fail(); }
    }).catch(fail);
  });
})();
