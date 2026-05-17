path = "src/pages/admin/Applications.tsx"
with open(path, encoding="utf-8") as f:
    c = f.read()
close_bad = "</" + "motion.div>"
close_good = "</" + "div>"
open_bad = "<" + "motion.div"
open_good = "<" + "motion.div"
open_good = "<" + "div>"
c = c.replace(close_bad, close_good)
c = c.replace(open_bad, open_good)
with open(path, "w", encoding="utf-8") as f:
    f.write(c)
print("remaining", c.count("motion.div"))
