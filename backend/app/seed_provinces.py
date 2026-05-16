from sqlalchemy.orm import Session
from .models import VnProvince, VnDistrict

PROVINCE_DISTRICT_DATA = {
    "Hà Nội": ["Hoàn Kiếm", "Cửa Nam", "Ba Đình", "Hai Bà Trưng", "Hoàng Mai"],
    "Hồ Chí Minh": ["Sài Gòn", "Chợ Lớn", "Thủ Đức", "Bến Thành", "Tân Định"],
    "Hải Phòng": [],
    "Đà Nẵng": [],
    "Huế": [],
    "Cần Thơ": [],
    "Tuyên Quang": [],
    "Cao Bằng": [],
    "Lai Châu": [],
    "Lào Cai": [],
    "Thái Nguyên": [],
    "Điện Biên": [],
    "Sơn La": [],
    "Lạng Sơn": [],
    "Quảng Ninh": [],
    "Bắc Ninh": [],
    "Hưng Yên": [],
    "Ninh Bình": [],
    "Thanh Hóa": [],
    "Nghệ An": [],
    "Hà Tĩnh": [],
    "Quảng Trị": [],
    "Quảng Ngãi": [],
    "Gia Lai": [],
    "Đắk Lắk": [],
    "Lâm Đồng": [],
    "Khánh Hòa": [],
    "Đồng Nai": [],
    "Tây Ninh": [],
    "Đồng Tháp": [],
    "Vĩnh Long": [],
    "Cà Mau": [],
    "An Giang": [],
    "Kiên Giang": [],
}


def seed_provinces(db: Session) -> None:
    existing = db.query(VnProvince).first()
    if existing:
        return

    for prov_name, districts in PROVINCE_DISTRICT_DATA.items():
        province = VnProvince(name=prov_name)
        db.add(province)
        db.flush()
        for dist_name in districts:
            db.add(VnDistrict(name=dist_name, province_id=province.id))

    db.commit()
